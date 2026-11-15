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
  * module      - import the file and run a small Python snippet against it
                  (`m` is the module, `capture(fn, *args, stdin="")` calls a
                  function and returns (stdout, exception)). Used to check
                  return values, raised exceptions and class structure.

On top of the tests, an exercise can ask for static checks on the source:

  * authorized      - builtin functions the subject allows; any other builtin
                      call fails (exception classes are always allowed)
  * typed           - every function has type hints (args + return)
  * only_functions  - nothing but imports and `def` at the top level
  * main_guard      - an `if __name__ == "__main__":` block is present
  * recursive       - at least one function calls itself
  * require_nodes   - {"ListComp": 2, ...}: minimum count of AST node types

Where the subject pins the output down, it is compared line by line (blank
lines included); curly vs straight quotes are normalised and trailing
whitespace is ignored. Random output is parsed back and checked for
consistency (`python` match). Exercises whose output the subject explicitly
says is *not* strictly checked (e.g. Code Cultivation) only look for the
expected markers, and their structure is checked with `module` tests instead.

Stdlib only. Python 3.8+.
"""

import argparse
import ast
import builtins
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

    if rtype == "lines":
        # exact line-by-line, an item {"re": ...} only has to match the regex
        import re
        got = norm.split("\n")
        want = rule["items"]
        for i, item in enumerate(want):
            line = got[i] if i < len(got) else None
            if isinstance(item, dict):
                ok = line is not None and re.fullmatch(item["re"], line)
            else:
                ok = line == normalize(item)
            if not ok:
                return False, (f"line {i + 1}: expected {item!r}, "
                               f"got {line!r}")
        if len(got) > len(want):
            return False, f"extra line {len(want) + 1}: {got[len(want)]!r}"
        return True, ""

    if rtype == "python":
        # free-form check: the snippet gets the output and asserts on it
        env = {"out": norm, "lines": norm.split("\n"), "parse": parse_literal}
        return run_snippet(rule["code"], env)

    return False, f"unknown match type {rtype!r}"


def parse_literal(text):
    """ast.literal_eval that also understands `set()` (empty set)."""
    text = text.strip()
    if text == "set()":
        return set()
    return ast.literal_eval(text)


def run_snippet(code, env):
    """Run assert-based check code. A list of lines is joined first."""
    if isinstance(code, list):
        code = "\n".join(code)
    try:
        exec(code, env)
    except AssertionError as exc:
        return False, str(exc) or "check failed"
    except Exception as exc:  # noqa: BLE001
        return False, f"{exc.__class__.__name__}: {exc}"
    return True, ""


def _diff(expected, actual):
    exp = expected.splitlines()
    act = actual.splitlines()
    i = 0
    while i < len(exp) and i < len(act) and exp[i] == act[i]:
        i += 1
    want = exp[i] if i < len(exp) else "(end of output)"
    got = act[i] if i < len(act) else "(end of output)"
    out = [f"first difference at line {i + 1}: expected {want!r}, got {got!r}"]
    out.append("expected:")
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
    # top-level code calling input() must not wait on the real keyboard
    old_stdin = sys.stdin
    sys.stdin = io.StringIO("")
    try:
        spec.loader.exec_module(module)
    finally:
        sys.stdin = old_stdin
    return module


def run_func_stdio(test, file_path):
    func_name = test["func"]
    args = test.get("args", [])
    stdin_data = test.get("stdin", "")

    try:
        with redirect_stdout(io.StringIO()):
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
# module mode
# --------------------------------------------------------------------------

def capture(func, *args, stdin=""):
    """Call func(*args) with stdin fed in. Returns (stdout, exception)."""
    old_stdin = sys.stdin
    sys.stdin = io.StringIO(stdin)
    buf = io.StringIO()
    error = None
    try:
        with redirect_stdout(buf):
            func(*args)
    except Exception as exc:  # noqa: BLE001
        error = exc
    finally:
        sys.stdin = old_stdin
    return buf.getvalue(), error


def run_module(test, file_path):
    try:
        with redirect_stdout(io.StringIO()):
            module = load_module(file_path)
    except Exception as exc:  # noqa: BLE001
        return False, f"import failed: {exc.__class__.__name__}: {exc}"
    env = {"m": module, "capture": capture}
    return run_snippet(test["code"], env)


# --------------------------------------------------------------------------
# static checks (read the source, never run it)
# --------------------------------------------------------------------------

def is_main_guard(node):
    return isinstance(node, ast.If) and "__name__" in ast.dump(node.test)


def check_authorized(tree, allowed):
    defined = {n.name for n in ast.walk(tree)
               if isinstance(n, (ast.FunctionDef, ast.ClassDef))}
    bad = []
    for node in ast.walk(tree):
        if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)):
            continue
        name = node.func.id
        if name in allowed or name in defined or not hasattr(builtins, name):
            continue
        obj = getattr(builtins, name)
        if isinstance(obj, type) and issubclass(obj, BaseException):
            continue
        bad.append(f"{name}() line {node.lineno}")
    if bad:
        return False, "not authorized: " + ", ".join(bad)
    return True, ""


def check_typed(tree):
    bad = []
    for node in ast.walk(tree):
        if not isinstance(node, ast.FunctionDef):
            continue
        args = node.args.posonlyargs + node.args.args + node.args.kwonlyargs
        if args and args[0].arg in ("self", "cls"):
            args = args[1:]
        missing = [a.arg for a in args if a.annotation is None]
        if node.returns is None and node.name != "__init__":
            missing.append("return")
        if missing:
            bad.append(f"{node.name}() line {node.lineno}: {', '.join(missing)}")
    if bad:
        return False, "missing type hints: " + "; ".join(bad)
    return True, ""


def check_only_functions(tree):
    bad = []
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.Import, ast.ImportFrom)):
            continue
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant):
            continue
        bad.append(f"line {node.lineno}")
    if bad:
        return False, "code outside a function: " + ", ".join(bad)
    return True, ""


def check_recursive(tree):
    for func in ast.walk(tree):
        if not isinstance(func, ast.FunctionDef):
            continue
        for node in ast.walk(func):
            if (isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
                    and node.func.id == func.name):
                return True, ""
    return False, "no function calls itself"


def check_nodes(tree, wanted):
    counts = {}
    for node in ast.walk(tree):
        name = node.__class__.__name__
        counts[name] = counts.get(name, 0) + 1
    bad = [f"{name}: {counts.get(name, 0)}/{n}"
           for name, n in wanted.items() if counts.get(name, 0) < n]
    if bad:
        return False, "missing constructs: " + ", ".join(bad)
    return True, ""


def static_checks(ex, file_path):
    """Return a list of (name, ok, detail) for the checks the exercise asks."""
    keys = ("authorized", "typed", "only_functions", "main_guard",
            "recursive", "require_nodes")
    if not any(k in ex for k in keys):
        return []
    try:
        with open(file_path, encoding="utf-8") as fh:
            tree = ast.parse(fh.read())
    except SyntaxError as exc:
        return [("source parses", False, str(exc))]

    results = []
    if "authorized" in ex:
        allowed = ex["authorized"]
        results.append(("only authorized functions: " + ", ".join(allowed),
                        *check_authorized(tree, allowed)))
    if ex.get("typed"):
        results.append(("type hints everywhere", *check_typed(tree)))
    if ex.get("only_functions"):
        results.append(("only functions, no main / top-level code",
                        *check_only_functions(tree)))
    if ex.get("main_guard"):
        ok = any(is_main_guard(n) for n in tree.body)
        results.append(('has an if __name__ == "__main__": block',
                        ok, "" if ok else "no main guard found"))
    if ex.get("recursive"):
        results.append(("really recursive", *check_recursive(tree)))
    if ex.get("require_nodes"):
        results.append(("uses the required constructs",
                        *check_nodes(tree, ex["require_nodes"])))
    return results


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
                [sys.executable, invoke, *argv],
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
    if mode == "module":
        return run_module(test, file_path)
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

        try:
            results += static_checks(ex, file_path)
        except Exception as exc:  # noqa: BLE001
            results.append(("static checks", False, f"tester error: {exc}"))

        for _, ok, _ in results:
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
