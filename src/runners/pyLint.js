'use strict';

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const c = require('../ui/colors');
const { detectPython } = require('./pyTester');

// flake8 is the Python "norminette" the subjects mandate; mypy is the type
// checker required on the typed exercises. Both are run via `python3 -m <tool>`
// so we use the same interpreter the tester runs against and get a clean
// "not installed" signal instead of a PATH miss.

function spawnAsync(cmd, args, opts) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let child;
    try {
      child = spawn(cmd, args, opts);
    } catch (err) {
      return resolve({ exitCode: 1, stdout, stderr, error: err });
    }
    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        process.stdout.write(chunk);
      });
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        process.stderr.write(chunk);
      });
    }
    child.on('error', (err) => resolve({ exitCode: 1, stdout, stderr, error: err }));
    child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }));
  });
}

function notInstalled(out) {
  return /No module named|not found|cannot find module/i.test(out);
}

async function runFlake8(projectDir) {
  const python = detectPython();
  if (!python) {
    return { tool: 'flake8', exitCode: 1, error: 'python3 not found on PATH' };
  }
  const run = await spawnAsync(python, ['-m', 'flake8', projectDir], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const out = (run.stderr || '') + (run.stdout || '');
  if (notInstalled(out)) {
    return { tool: 'flake8', exitCode: 127, error: 'flake8 is not installed' };
  }
  return { tool: 'flake8', exitCode: run.exitCode, stdout: run.stdout, stderr: run.stderr };
}

// `targets` is an array of relative paths; falls back to the whole directory.
async function runMypy(projectDir, targets) {
  const python = detectPython();
  if (!python) {
    return { tool: 'mypy', exitCode: 1, error: 'python3 not found on PATH' };
  }
  const args = ['-m', 'mypy', '--cache-dir', path.join(os.tmpdir(), '42-mypy-cache')];
  if (Array.isArray(targets) && targets.length) {
    args.push(...targets.map((t) => path.join(projectDir, t)));
  } else {
    args.push(projectDir);
  }
  const run = await spawnAsync(python, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const out = (run.stderr || '') + (run.stdout || '');
  if (notInstalled(out)) {
    return { tool: 'mypy', exitCode: 127, error: 'mypy is not installed' };
  }
  return { tool: 'mypy', exitCode: run.exitCode, stdout: run.stdout, stderr: run.stderr };
}

function summarize(result) {
  const label = result.tool === 'mypy' ? 'mypy' : 'flake8';
  const lines = [''];
  if (result.exitCode === 127 || (result.error && /not installed/i.test(result.error))) {
    lines.push(`${c.bold(label + ':')} ${c.yellow('SKIPPED')}`);
    lines.push(`  ${c.yellow(`${label} is not installed`)}`);
    lines.push(`  ${c.yellow('hint:')} install with ${c.bold(`pip install ${label}`)}.`);
    return lines.join('\n');
  }
  if (result.error) {
    lines.push(`${c.bold(label + ':')} ${c.red('FAIL')}`);
    lines.push(`  ${c.red('error:')} ${result.error.message || result.error}`);
    return lines.join('\n');
  }
  const passed = result.exitCode === 0;
  lines.push(`${c.bold(label + ':')} ${passed ? c.green('PASS') : c.red('FAIL')}`);
  if (!passed) {
    lines.push(`  ${c.dim('see the per-file output above for the offending lines.')}`);
  } else {
    lines.push(`  ${c.dim('no issues reported.')}`);
  }
  return lines.join('\n');
}

module.exports = { runFlake8, runMypy, summarize };
