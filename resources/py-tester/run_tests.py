#!/usr/bin/env python3
"""Generic behavioural tester for the 42 Python data-engineering modules.

The C testers in this repo compile the student's code and run a bundled binary.
Python projects can't be compiled, so this harness does the analogous thing:
it imports/runs each exercise the way the subject says to run it, captures the
output, and checks it against the behaviour the subject pins down.

A run is driven entirely by a JSON spec (resources/py-tester/specs/<id>.json).
Each exercise has one or more tests; each test runs in one of two modes:

  * func_stdio  - import the requested function from the file, feed it stdin,
                  call it, capture stdout. Used for the "write only a function"
                  modules (Growing Code).
  * script      - run `python3 <file>` the way a student would, with argv /
                  stdin / fixture files, capture stdout+stderr+exit code.

Matching is deliberately tolerant where the subject leaves wording to the
student (curly vs straight quotes are normalised, trailing whitespace ignored)
and uses substring/ordered checks for the tokens the subject fixes verbatim,
rather than brittle full-output equality. Exercises whose output the subject
explicitly says is *not* strictly checked (e.g. Code Cultivation) use smoke
checks: "runs without crashing + the expected markers appear".

Stdlib only. Python 3.8+.
"""

import argparse
import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback
from contextlib import redirect_stdout

# --------------------------------------------------------------------------
# colours
# --------------------------------------------------------------------------

USE_COLOR = False


def _c(code, s):
    if not USE_COLOR:
        return s
    return f"\033[{code}m{s}\033[0m"


def green(s):
    return _c("32", s)


def red(s):
    return _c("31", s)


def yellow(s):
    return _c("33", s)


def cyan(s):
    return _c("36", s)


def dim(s):
    return _c("2", s)


def bold(s):
    return _c("1", s)


# --------------------------------------------------------------------------
# normalisation + matching
# --------------------------------------------------------------------------

def normalize(text):
    """Make student output comparable: unify the typographic quotes the PDF
    examples use with the ASCII ones a program actually prints, and ignore
    trailing whitespace / blank trailing lines."""
    if text is None:
        text = ""
    text = (text
            .replace("’", "'").replace("‘", "'")
            .replace("“", '"').replace("”", '"')
            .replace("–", "-").replace("—", "-"))
    lines = [ln.rstrip() for ln in text.splitlines()]
    while lines and lines[-1] == "":
        lines.pop()
    return "\n".join(lines)


def check_rule(rule, actual):
    """Return (ok, detail). `rule` is a match descriptor dict."""
    if rule is None:
        return True, ""
    norm = normalize(actual)
    rtype = rule.get("type", "contains_all")

    if rtype == "equals":
        expected = normalize(rule["expected"])
        if norm == expected:
            return True, ""
        return False, _diff(expected, norm)

    if rtype == "contains_all":
        missing = []
        for item in rule["items"]:
            if normalize(item) not in norm:
                missing.append(item)
        if missing:
            return False, "missing: " + ", ".join(repr(m) for m in missing)
        return True, ""

    if rtype == "in_order":
        pos = 0
        for item in rule["items"]:
            needle = normalize(item)
            idx = norm.find(needle, pos)
            if idx < 0:
                return False, f"not found in order: {item!r}"
            pos = idx + len(needle)
        return True, ""

    if rtype == "regex":
        import re
        if re.search(rule["pattern"], norm, re.MULTILINE | re.DOTALL):
            return True, ""
        return False, f"no match for /{rule['pattern']}/"

    if rtype == "not_empty":
        if norm.strip():
            return True, ""
        return False, "output was empty"

    return False, f"unknown match type {rtype!r}"


def _diff(expected, actual):
    exp = expected.splitlines()
    act = actual.splitlines()
    out = ["expected:"]
    out += ["    " + ln for ln in exp[:12]]
    out.append("got:")
    out += ["    " + ln for ln in act[:12]]
    return "\n      ".join(out)


# --------------------------------------------------------------------------
# func_stdio mode
# --------------------------------------------------------------------------

def load_module(file_path):
    mod_dir = os.path.dirname(os.path.abspath(file_path))
    if mod_dir not in sys.path:
        sys.path.insert(0, mod_dir)
    name = "student_" + os.path.splitext(os.path.basename(file_path))[0]
    spec = importlib.util.spec_from_file_location(name, file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run_func_stdio(test, file_path):
    func_name = test["func"]
    args = test.get("args", [])
    stdin_data = test.get("stdin", "")

    try:
        module = load_module(file_path)
    except Exception as exc:  # noqa: BLE001 - report any import-time failure
        return False, f"import failed: {exc.__class__.__name__}: {exc}"

    if not hasattr(module, func_name):
        return False, f"function {func_name}() is not defined in the file"
    func = getattr(module, func_name)

    old_stdin = sys.stdin
    buf = io.StringIO()
    sys.stdin = io.StringIO(stdin_data)
    expect_raise = test.get("expect_raise", False)
    try:
        with redirect_stdout(buf):
            func(*args)
    except Exception as exc:  # noqa: BLE001
        if expect_raise:
            pass
        else:
            tb = traceback.format_exc().strip().splitlines()
            return False, f"raised {exc.__class__.__name__}: {exc}\n      " + (tb[-1] if tb else "")
    else:
        if expect_raise:
            return False, "expected the call to raise, but it returned normally"
    finally:
        sys.stdin = old_stdin

    return check_rule(test.get("match"), buf.getvalue())


# --------------------------------------------------------------------------
# script mode
# --------------------------------------------------------------------------

def run_script(test, file_path, project_dir):
    """Run the file as a standalone script the way the subject demonstrates."""
    argv = test.get("argv", [])
    stdin_data = test.get("stdin", "")
    fixtures = test.get("fixtures", {})
    cwd_mode = test.get("cwd", "scriptdir")
    timeout = test.get("timeout", 15)

    tmp = None
    # Fixtures written into the student's own directory (scriptdir mode) must be
    # removed afterwards so a test run never leaves stray files behind — or, worse,
    # clobbers a real file of the same name. We only delete fixtures we created
    # that didn't already exist; pre-existing files are left untouched.
    written_fixtures = []
    try:
        if cwd_mode == "temp":
            tmp = tempfile.mkdtemp(prefix="42pytest_")
            run_file = os.path.join(tmp, os.path.basename(file_path))
            shutil.copy(file_path, run_file)
            cwd = tmp
            invoke = os.path.basename(file_path)
        else:
            cwd = os.path.dirname(os.path.abspath(file_path))
            invoke = os.path.basename(file_path)

        for fname, content in fixtures.items():
            fixture_path = os.path.join(cwd, fname)
            if not tmp and not os.path.exists(fixture_path):
                written_fixtures.append(fixture_path)
            with open(fixture_path, "w") as fh:
                fh.write(content)

        try:
            proc = subprocess.run(
                [sys.executable, "-B", invoke, *argv],
                cwd=cwd,
                input=stdin_data,
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            return False, (f"timed out after {timeout}s — the script likely "
                           "waited on input that wasn't provided, or looped forever")
        except Exception as exc:  # noqa: BLE001
            return False, f"failed to launch: {exc}"

        match = test.get("match", {})
        details = []

        if "exit_code" in match:
            want = match["exit_code"]
            if proc.returncode != want:
                details.append(f"exit code: expected {want}, got {proc.returncode}")

        if "stdout" in match:
            ok, detail = check_rule(match["stdout"], proc.stdout)
            if not ok:
                details.append("stdout — " + detail)

        if "stderr" in match:
            ok, detail = check_rule(match["stderr"], proc.stderr)
            if not ok:
                details.append("stderr — " + detail)

        for out_check in test.get("outputs", []):
            path = os.path.join(cwd, out_check["file"])
            if not os.path.exists(path):
                details.append(f"expected output file {out_check['file']!r} was not created")
                continue
            with open(path) as fh:
                ok, detail = check_rule(out_check.get("match"), fh.read())
            if not ok:
                details.append(f"output file {out_check['file']!r} — " + detail)

        if details:
            return False, "\n      ".join(details)
        return True, ""
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
        for fixture_path in written_fixtures:
            try:
                os.remove(fixture_path)
            except OSError:
                pass


# --------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------

def run_test(test, file_path, project_dir):
    mode = test.get("mode", "script")
    if mode == "func_stdio":
        return run_func_stdio(test, file_path)
    if mode == "script":
        return run_script(test, file_path, project_dir)
    return False, f"unknown test mode {mode!r}"


def main():
    global USE_COLOR
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True)
    parser.add_argument("--dir", required=True)
    parser.add_argument("--exercise", default=None,
                        help="only run this exercise id (e.g. ex2)")
    parser.add_argument("--color", action="store_true")
    parser.add_argument("--list", action="store_true",
                        help="list exercises and exit")
    args = parser.parse_args()
    USE_COLOR = args.color

    with open(args.spec) as fh:
        spec = json.load(fh)

    exercises = spec["exercises"]
    if args.exercise:
        exercises = [ex for ex in exercises if ex["id"] == args.exercise]
        if not exercises:
            print(red(f"  no exercise {args.exercise!r} in this project"))
            return 2

    if args.list:
        for ex in spec["exercises"]:
            print(f"{ex['id']}\t{ex['title']}\t{ex['file']}")
        return 0

    project_dir = os.path.abspath(args.dir)
    total_pass = total_fail = total_skip = 0
    ran_any = False

    print()
    note = spec.get("note")
    if note:
        print(dim(f"  {note}"))
        print()

    for ex in exercises:
        file_rel = ex["file"]
        file_path = os.path.join(project_dir, file_rel)
        title = f"{ex['id']} · {ex['title']}"
        extra = [os.path.join(project_dir, f) for f in ex.get("extra_files", [])]

        if not os.path.exists(file_path) or any(not os.path.exists(p) for p in extra):
            print(f"  {yellow('SKIP')} {title}  {dim('— ' + file_rel + ' not found')}")
            total_skip += 1
            continue

        ex_pass = ex_fail = 0
        results = []
        for test in ex["tests"]:
            ran_any = True
            try:
                ok, detail = run_test(test, file_path, project_dir)
            except Exception as exc:  # noqa: BLE001 - never let one test kill the run
                ok, detail = False, f"tester error: {exc.__class__.__name__}: {exc}"
            results.append((test.get("name", "test"), ok, detail))
            if ok:
                ex_pass += 1
            else:
                ex_fail += 1

        total_pass += ex_pass
        total_fail += ex_fail
        head = green("PASS") if ex_fail == 0 else red("FAIL")
        print(f"  {head} {title}  {dim(f'({ex_pass}/{ex_pass + ex_fail})')}")
        for name, ok, detail in results:
            mark = green("  ✓") if ok else red("  ✗")
            print(f"    {mark} {name}")
            if not ok and detail:
                for line in detail.splitlines():
                    print(dim(f"        {line}"))

    print()
    summary = (f"{bold('Result:')} "
               f"{green(str(total_pass) + ' passed')}, "
               f"{red(str(total_fail) + ' failed')}, "
               f"{yellow(str(total_skip) + ' skipped')}")
    print("  " + summary)
    print()

    if total_fail > 0:
        return 1
    if not ran_any:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
