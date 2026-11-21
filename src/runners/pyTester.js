'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const c = require('../ui/colors');

const TESTER_DIR = path.join(__dirname, '..', '..', 'resources', 'py-tester');
const HARNESS = path.join(TESTER_DIR, 'run_tests.py');
const SPECS_DIR = path.join(TESTER_DIR, 'specs');

let cachedPython;

// Find a usable interpreter once. The subjects target Python 3.10+, but the
// harness itself is 3.8-compatible — we only need *an* interpreter to launch
// it, and the harness reuses the same one (sys.executable) for the scripts.
function detectPython() {
  if (cachedPython !== undefined) return cachedPython;
  for (const cmd of ['python3', 'python']) {
    try {
      const r = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
      if (!r.error && r.status === 0) {
        cachedPython = cmd;
        return cmd;
      }
    } catch {
      /* try next */
    }
  }
  cachedPython = null;
  return null;
}

function loadSpec(specName) {
  const p = path.join(SPECS_DIR, specName);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

// Every relative file an exercise needs present to be runnable.
function exerciseFiles(ex) {
  return [ex.file, ...(ex.extra_files || [])];
}

// A directory looks like this project if at least one exercise's files are
// all present. Mirrors the permissive detection the C testers use — we don't
// insist the whole project is finished before letting the user test part of it.
function hasAnyExercise(dir, spec) {
  return spec.exercises.some((ex) =>
    exerciseFiles(ex).every((f) => fs.existsSync(path.join(dir, f)))
  );
}

function listImplemented(dir, spec) {
  const present = [];
  const missing = [];
  for (const ex of spec.exercises) {
    const ok = exerciseFiles(ex).every((f) => fs.existsSync(path.join(dir, f)));
    (ok ? present : missing).push(ex);
  }
  return { present, missing };
}

function spawnAsync(cmd, args, opts) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(cmd, args, opts);
    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        if (opts && opts.streamStdout !== false) process.stdout.write(chunk);
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        if (opts && opts.streamStderr !== false) process.stderr.write(chunk);
      });
    }
    child.on('error', (err) => resolve({ exitCode: 1, stdout, stderr, error: err }));
    child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }));
  });
}

// Run the harness for a whole project, or a single exercise (opts.exercise).
async function runTester(projectDir, specName, opts = {}) {
  const python = detectPython();
  if (!python) {
    return {
      exitCode: 1,
      stage: 'setup',
      error: 'python3 was not found on your PATH (install Python 3.10+).',
    };
  }
  if (!fs.existsSync(HARNESS)) {
    return { exitCode: 1, stage: 'setup', error: `tester harness missing at ${HARNESS}` };
  }
  const specPath = path.join(SPECS_DIR, specName);
  if (!fs.existsSync(specPath)) {
    return { exitCode: 1, stage: 'setup', error: `spec missing at ${specPath}` };
  }

  const args = ['-B', HARNESS, '--spec', specPath, '--dir', projectDir, '--color'];
  if (opts.exercise) args.push('--exercise', opts.exercise);

  const run = await spawnAsync(python, args, { stdio: ['inherit', 'pipe', 'pipe'] });
  return {
    exitCode: run.exitCode,
    stage: 'run',
    stdout: run.stdout,
    stderr: run.stderr,
    error: run.error,
  };
}

function summarize(result) {
  const lines = [];
  if (result.stage === 'setup') {
    lines.push('', `${c.bold('Result:')} ${c.red('FAIL — setup')}`);
    lines.push(`  ${c.red(result.error || 'tester unavailable')}`);
    if (/python3/i.test(result.error || '')) {
      lines.push(`  ${c.yellow('hint:')} install Python 3.10+ and make sure ${c.bold('python3')} is on your PATH.`);
    }
    return lines.join('\n');
  }
  // exit 2 means the harness ran but every exercise file was absent.
  if (result.exitCode === 2) {
    lines.push(`  ${c.yellow('Nothing to test')} ${c.dim('— no exercise files were found in this directory.')}`);
    lines.push(`  ${c.dim('check you pointed at the project root (the folder holding ex0/, ex1/, …).')}`);
    return lines.join('\n');
  }
  // The harness already printed its own coloured per-exercise summary.
  return '';
}

module.exports = {
  TESTER_DIR,
  SPECS_DIR,
  detectPython,
  loadSpec,
  hasAnyExercise,
  listImplemented,
  exerciseFiles,
  runTester,
  summarize,
};
