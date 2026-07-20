'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const c = require('../ui/colors');
const { detectPython } = require('./pyTester');

const EXAM_DIR = path.join(__dirname, '..', '..', 'resources', 'exam');
const HARNESS = path.join(EXAM_DIR, 'run_exam.py');

let cachedCC;

// A C compiler is needed for the Programming Fundamentals exam. cc or gcc.
function detectCC() {
  if (cachedCC !== undefined) return cachedCC;
  for (const cmd of ['cc', 'gcc']) {
    try {
      const r = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
      if (!r.error && r.status === 0) {
        cachedCC = cmd;
        return cmd;
      }
    } catch {
      /* try next */
    }
  }
  cachedCC = null;
  return null;
}

function bankDir(bank) {
  return path.join(EXAM_DIR, bank);
}

// Load every exercise spec in a bank, sorted for stable ordering.
function loadBank(bank) {
  const dir = bankDir(bank);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.json')) continue;
    try {
      const spec = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      out.push({ ...spec, _specPath: path.join(dir, name) });
    } catch {
      /* skip malformed spec */
    }
  }
  return out;
}

function specPath(bank, id) {
  return path.join(bankDir(bank), `${id}.json`);
}

// Resolve an exam config into its exercise pool.
//
// An exam may span several banks (practising "medium Python" draws on both
// Rank 03 and Rank 04) and may narrow them to one difficulty tier. Every
// exercise is tagged with the bank it came from, so grading a pooled exam can
// still find each spec without knowing which bank the exam was configured with.
function loadExam(cfg) {
  if (!cfg) return [];
  const banks = cfg.banks || (cfg.bank ? [cfg.bank] : []);
  const out = [];
  for (const bank of banks) {
    for (const ex of loadBank(bank)) {
      if (cfg.tier && ex.tier !== cfg.tier) continue;
      out.push({ ...ex, bank });
    }
  }
  return out;
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

// Grade one exercise solved in `exerciseDir` against the bank spec at `spec`.
async function gradeExercise(exerciseDir, spec) {
  const python = detectPython();
  if (!python) {
    return { exitCode: 1, stage: 'setup', error: 'python3 was not found on your PATH (the grader needs it).' };
  }
  if (!fs.existsSync(HARNESS)) {
    return { exitCode: 1, stage: 'setup', error: `grader harness missing at ${HARNESS}` };
  }
  if (!fs.existsSync(spec)) {
    return { exitCode: 1, stage: 'setup', error: `exercise spec missing at ${spec}` };
  }

  const args = [HARNESS, '--spec', spec, '--dir', exerciseDir, '--color'];
  // stdin is ignored, not inherited: the harness feeds each test its own stdin
  // and never reads ours, so inheriting only lets it swallow keystrokes meant
  // for the menu that is waiting behind it (the exam simulator's command loop).
  const run = await spawnAsync(python, args, { stdio: ['ignore', 'pipe', 'pipe'] });
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
    lines.push(`  ${c.red(result.error || 'grader unavailable')}`);
    if (/python3/i.test(result.error || '')) {
      lines.push(`  ${c.yellow('hint:')} install Python 3.10+ and make sure ${c.bold('python3')} is on your PATH.`);
    }
    return lines.join('\n');
  }
  // exit 3 = environment problem (no C compiler); the harness printed the why.
  if (result.exitCode === 3) {
    lines.push(`  ${c.yellow('hint:')} install a C compiler (${c.bold('cc')} or ${c.bold('gcc')}) to grade C exams.`);
    return lines.join('\n');
  }
  // exit 2 = solution file not created yet; harness already explained it.
  // The harness prints its own coloured per-test summary otherwise.
  return '';
}

// passed == every test green (exit 0). Used for stats/achievements.
function passed(result) {
  return result && result.stage === 'run' && result.exitCode === 0;
}

module.exports = {
  EXAM_DIR,
  HARNESS,
  detectCC,
  loadBank,
  loadExam,
  bankDir,
  specPath,
  gradeExercise,
  summarize,
  passed,
};
