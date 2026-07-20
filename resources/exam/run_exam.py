#!/usr/bin/env python3
"""Generic grader for a single Exam Practice exercise.

The piscine tester (resources/py-tester/run_tests.py) grades a whole project
against a behavioural spec. This harness does the same job for one standalone
exam exercise, in either language:

  * lang == "c"      compile the student's source(s) with cc -Wall -Wextra
                     -Werror into a throwaway binary, then run it per test.
  * lang == "python" run `python3 <solution_file>` per test.

There are two grading modes. The default ("program") feeds argv + stdin and
checks exit code / stdout / stderr. `mode: "function"` — used by the Rank 03 /
Rank 04 Python exams, where the subject pins down a function signature rather
than a whole program — imports the student's module and calls the function,
comparing return values. Driven by one exercise JSON spec:

  --spec  path to the exercise spec (resources/exam/<bank>/<id>.json)
  --dir   the folder the student solved the exercise in (holds solution_file)

Exit codes mirror the project tester: 0 all passed, 1 something failed (or a
build error), 2 the solution file is missing, 3 the environment is unusable
(no C compiler).

Stdlib only, Python 3.8+.
"""

import argparse
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile

# --------------------------------------------------------------------------
# colours
# --------------------------------------------------------------------------

USE_COLOR = False


def _c(code, s):
    return f"\033[{code}m{s}\033[0m" if USE_COLOR else s


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
# (kept in sync with resources/py-tester/run_tests.py — same semantics)
# --------------------------------------------------------------------------

def normalize(text):
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


def _diff(expected, actual):
    exp = expected.splitlines()
    act = actual.splitlines()
    out = ["expected:"]
    out += ["    " + ln for ln in exp[:12]]
    out.append("got:")
    out += ["    " + ln for ln in act[:12]]
    return "\n      ".join(out)


def check_rule(rule, actual):
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
        missing = [item for item in rule["items"] if normalize(item) not in norm]
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


# --------------------------------------------------------------------------
# running a single test against a command
# --------------------------------------------------------------------------

def run_one(cmd, cwd, test):
    argv = test.get("argv", [])
    stdin_data = test.get("stdin", "")
    timeout = test.get("timeout", 15)
    try:
        proc = subprocess.run(
            [*cmd, *argv],
            cwd=cwd,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return False, (f"timed out after {timeout}s — the program likely "
                       "looped forever or waited on input")
    except Exception as exc:  # noqa: BLE001
        return False, f"failed to launch: {exc}"

    match = test.get("match", {})
    details = []
    if "exit_code" in match and proc.returncode != match["exit_code"]:
        details.append(f"exit code: expected {match['exit_code']}, got {proc.returncode}")
    if "stdout" in match:
        ok, detail = check_rule(match["stdout"], proc.stdout)
        if not ok:
            details.append("stdout — " + detail)
    if "stderr" in match:
        ok, detail = check_rule(match["stderr"], proc.stderr)
        if not ok:
            details.append("stderr — " + detail)
    if details:
        return False, "\n      ".join(details)
    return True, ""


# --------------------------------------------------------------------------
# function mode (Rank 03 / Rank 04 Python exams)
#
# The subject fixes a signature, so we import the student's module and call the
# function instead of running the file as a program. Both the call and the
# expected value are stored as Python source in the spec and eval'd here, so a
# spec entry reads exactly like the example line in the subject.
# --------------------------------------------------------------------------

class _Timeout(Exception):
    pass


def _on_alarm(signum, frame):  # noqa: ARG001
    raise _Timeout()


class _Guard:
    """Run a block under a wall-clock timeout with stdout/stdin neutralised.

    Student code that prints debug noise or blocks on input() must not corrupt
    or hang the grader; whatever it printed is kept so a failing test can show
    it as a hint.
    """

    def __init__(self, seconds):
        self.seconds = seconds
        self.output = ""

    def __enter__(self):
        import io
        self._buf = io.StringIO()
        self._stdout, self._stdin = sys.stdout, sys.stdin
        sys.stdout = self._buf
        sys.stdin = open(os.devnull)
        self._prev = signal.signal(signal.SIGALRM, _on_alarm)
        signal.setitimer(signal.ITIMER_REAL, self.seconds)
        return self

    def __exit__(self, exc_type, exc, tb):
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, self._prev)
        self.output = self._buf.getvalue()
        try:
            sys.stdin.close()
        except Exception:  # noqa: BLE001
            pass
        sys.stdout, sys.stdin = self._stdout, self._stdin
        return False


def check_forbidden(spec, sol_path):
    """Reject solutions that use functions the subject forbids."""
    tokens = spec.get("forbidden") or []
    if not tokens:
        return None
    try:
        with open(sol_path, encoding="utf-8", errors="replace") as fh:
            src = fh.read()
    except OSError:
        return None
    # strip comments so a mention in a comment does not trip the check
    code = "\n".join(line.split("#", 1)[0] for line in src.splitlines())
    hits = [tok for tok in tokens if tok in code]
    return hits or None


def load_solution(sol_path, timeout=10):
    """Import the student's file as a module. Returns (module, error)."""
    import importlib.util
    name = "student_solution"
    spec_obj = importlib.util.spec_from_file_location(name, sol_path)
    if spec_obj is None or spec_obj.loader is None:
        return None, "could not load the file as a Python module"
    module = importlib.util.module_from_spec(spec_obj)
    sys.modules[name] = module
    try:
        with _Guard(timeout):
            spec_obj.loader.exec_module(module)
    except _Timeout:
        return None, (f"importing the file took longer than {timeout}s — is "
                      "there code running at import time (a loop, or input())?")
    except BaseException as exc:  # noqa: BLE001
        return None, f"the file raised {exc.__class__.__name__} while being imported: {exc}"
    return module, None


def _strict_equal(expected, actual):
    """== plus a bool/int guard, since True == 1 in Python."""
    if isinstance(expected, bool) != isinstance(actual, bool):
        return False
    if expected != actual:
        return False
    # tuple vs list must not pass just because their contents match
    if isinstance(expected, (list, tuple)) and type(expected) is not type(actual):
        return False
    return True


def run_function_test(module, fn_name, test, timeout=5):
    """Eval the call expression against the student's module."""
    env = {"__builtins__": __builtins__}
    for attr in dir(module):
        if not attr.startswith("__"):
            env[attr] = getattr(module, attr)

    call = test.get("call", "")
    guard = _Guard(timeout)
    try:
        with guard:
            actual = eval(call, env)  # noqa: S307 - spec-authored, not user input
    except _Timeout:
        return False, (f"timed out after {timeout}s — the function likely "
                       "looped forever")
    except BaseException as exc:  # noqa: BLE001
        detail = f"raised {exc.__class__.__name__}: {exc}"
        if guard.output.strip():
            detail += "\nit printed: " + guard.output.strip().splitlines()[0]
        return False, detail

    try:
        expected = eval(test["expect"], {"__builtins__": __builtins__})  # noqa: S307
    except BaseException as exc:  # noqa: BLE001
        return False, f"broken spec — cannot evaluate expected value: {exc}"

    if _strict_equal(expected, actual):
        return True, ""

    detail = f"expected: {expected!r}\ngot:      {actual!r}"
    if isinstance(expected, bool) and not isinstance(actual, bool):
        detail += f"\nhint:     return a bool, not {type(actual).__name__}"
    if guard.output.strip():
        detail += "\nit printed: " + guard.output.strip().splitlines()[0]
    return False, detail


def grade_function_mode(spec, sol_path):
    """Grade a signature-based exercise. Mirrors the program-mode reporting."""
    fn_name = spec.get("function")
    if not fn_name:
        print(f"  {red('broken spec — no function name')}")
        return 3

    hits = check_forbidden(spec, sol_path)
    if hits:
        print(f"  {red('FORBIDDEN FUNCTION')}")
        for h in hits:
            print(dim(f"      you used {h!r} — the subject forbids it"))
        print()
        print(f"  {bold('Result:')} {red('FAIL')} {dim('(forbidden function)')}")
        print()
        return 1

    module, err = load_solution(sol_path)
    if err:
        print(f"  {red('✗ ' + err)}")
        print()
        print(f"  {bold('Result:')} {red('FAIL')} {dim('(the file could not be imported)')}")
        print()
        return 1

    fn = getattr(module, fn_name, None)
    if fn is None:
        print(f"  {red('✗ no function named ' + fn_name + ' in ' + os.path.basename(sol_path))}")
        print(f"  {dim('expected: ' + spec.get('signature', 'def ' + fn_name + '(...)'))}")
        print()
        print(f"  {bold('Result:')} {red('FAIL')} {dim('(function not found)')}")
        print()
        return 1
    if not callable(fn):
        print(f"  {red('✗ ' + fn_name + ' exists but is not a function')}")
        print()
        return 1

    n_pass = n_fail = 0
    timeouts = 0
    tests = spec.get("tests", [])
    for i, test in enumerate(tests):
        # a function that hangs hangs on everything — don't burn 5s per test
        if timeouts >= 2:
            remaining = len(tests) - i
            print(dim(f"    … skipped {remaining} more test(s) — the function keeps hanging"))
            n_fail += remaining
            break
        try:
            ok, detail = run_function_test(module, fn_name, test)
        except Exception as exc:  # noqa: BLE001
            ok, detail = False, f"grader error: {exc.__class__.__name__}: {exc}"
        if not ok and "timed out" in detail:
            timeouts += 1
        mark = green("  ✓") if ok else red("  ✗")
        print(f"  {mark} {test.get('name', 'test')}")
        if not ok and detail:
            for line in detail.splitlines():
                print(dim(f"        {line}"))
        if ok:
            n_pass += 1
        else:
            n_fail += 1

    print()
    head = green("PASS") if n_fail == 0 else red("FAIL")
    print(f"  {bold('Result:')} {head} {dim(f'({n_pass}/{n_pass + n_fail} tests)')}")
    print()
    return 0 if n_fail == 0 else 1


# --------------------------------------------------------------------------
# compilation (C)
# --------------------------------------------------------------------------

def compile_c(spec, project_dir, out_path):
    """Compile the exercise's C sources into out_path. Returns (ok, message)."""
    if shutil.which("cc") is None and shutil.which("gcc") is None:
        return None, "no C compiler found (install cc / gcc)"
    compiler = "cc" if shutil.which("cc") else "gcc"

    comp = spec.get("compile", {})
    flags = comp.get("flags", ["-Wall", "-Wextra", "-Werror"])
    sources = [spec["solution_file"], *comp.get("extra_files", [])]
    missing = [s for s in sources if not os.path.exists(os.path.join(project_dir, s))]
    if missing:
        return False, "missing source file(s): " + ", ".join(missing)

    cmd = [compiler, *flags, *sources, "-o", out_path]
    try:
        proc = subprocess.run(cmd, cwd=project_dir, capture_output=True,
                              text=True, timeout=60)
    except subprocess.TimeoutExpired:
        return False, "compilation timed out"
    if proc.returncode != 0:
        err = (proc.stderr or proc.stdout or "").strip().splitlines()
        return False, "\n      ".join(err[-12:]) or "compilation failed"
    return True, ""


# --------------------------------------------------------------------------
# driver
# --------------------------------------------------------------------------

def main():
    global USE_COLOR
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec", required=True)
    parser.add_argument("--dir", required=True)
    parser.add_argument("--color", action="store_true")
    args = parser.parse_args()
    USE_COLOR = args.color

    with open(args.spec) as fh:
        spec = json.load(fh)

    project_dir = os.path.abspath(args.dir)
    lang = spec.get("lang", "c")
    solution_file = os.path.basename(spec["solution_file"])
    sol_path = os.path.join(project_dir, solution_file)

    title = f"{spec.get('id', '?')} · {spec.get('title', '')}"
    print()
    print(f"  {cyan(bold(title))}  {dim('· difficulty ' + str(spec.get('difficulty', '?')) + '/4')}")
    print()

    if not os.path.exists(sol_path):
        print(f"  {yellow('Nothing to grade')} {dim('— ' + solution_file + ' was not found here.')}")
        print(f"  {dim('create ' + solution_file + ' in ' + project_dir + ' and grade again.')}")
        print()
        return 2

    if spec.get("mode") == "function":
        return grade_function_mode(spec, sol_path)

    tmp = None
    run_cmd = None
    cwd = project_dir
    try:
        if lang == "c":
            tmp = tempfile.mkdtemp(prefix="42exam_")
            out_path = os.path.join(tmp, "exam_bin")
            ok, msg = compile_c(spec, project_dir, out_path)
            if ok is None:
                print(f"  {red('✗ ' + msg)}")
                print()
                return 3
            if not ok:
                print(f"  {red('BUILD ERROR')}")
                for line in msg.splitlines():
                    print(dim(f"      {line}"))
                print()
                print("  " + f"{bold('Result:')} {red('build failed')}")
                print()
                return 1
            run_cmd = [out_path]
        elif lang == "python":
            run_cmd = [sys.executable, solution_file]
        else:
            print(f"  {red('unknown exercise language ' + repr(lang))}")
            return 3

        tests = spec.get("tests", [])
        n_pass = n_fail = 0
        for test in tests:
            try:
                ok, detail = run_one(run_cmd, cwd, test)
            except Exception as exc:  # noqa: BLE001
                ok, detail = False, f"grader error: {exc.__class__.__name__}: {exc}"
            mark = green("  ✓") if ok else red("  ✗")
            print(f"  {mark} {test.get('name', 'test')}")
            if not ok and detail:
                for line in detail.splitlines():
                    print(dim(f"        {line}"))
            if ok:
                n_pass += 1
            else:
                n_fail += 1

        print()
        head = green("PASS") if n_fail == 0 else red("FAIL")
        print(f"  {bold('Result:')} {head} "
              f"{dim(f'({n_pass}/{n_pass + n_fail} tests)')}")
        print()
        return 0 if n_fail == 0 else 1
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
