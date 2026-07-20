'use strict';

// Exam simulator — the real 42 exam loop, minus the punishment.
//
// The real exam drops you in a folder, hands you ONE exercise, and only reveals
// the next one once you pass. Fail and you wait out a retry timer. This
// reproduces everything except the timer: you see one subject at a time, you
// type `grademe` to submit, and a failure tells you exactly which case broke so
// you can fix it and resubmit immediately.
//
// Compare with examPractice.js, which hands you N exercises up front and grades
// them in a batch — that mode is for drilling, this one is for rehearsing.

const fs = require('fs');
const os = require('os');
const path = require('path');
const c = require('../ui/colors');
const { createPrompt } = require('../ui/input');
const grader = require('../runners/examGrader');
const { detectPython } = require('../runners/pyTester');
const { t } = require('../i18n');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The exam ladder, easiest first. Exercises without a level fall back to their
// 1-4 difficulty.
//
// A rank ladder takes ONE exercise per level, which is the shape of a real
// sitting. A difficulty drill (`all`) instead walks every exercise in the tier,
// still level-ordered — the point there is to cover the band, not to reproduce
// an exam, and one-per-level would leave most of the set unseen.
function buildLadder(bank, { all = false } = {}) {
  const byLevel = new Map();
  for (const ex of bank) {
    const lvl = ex.level || ex.difficulty || 1;
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl).push(ex);
  }
  const levels = [...byLevel.keys()].sort((a, b) => a - b);
  const out = [];
  for (const lvl of levels) {
    const picked = shuffle(byLevel.get(lvl));
    for (const exercise of (all ? picked : picked.slice(0, 1))) {
      out.push({ level: lvl, exercise });
    }
  }
  return out;
}

function timestamp(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`
    + `-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

// The exam folder goes on the Desktop like the real thing, so it is somewhere
// you can actually find and open. Falls back to cwd on machines without one.
function examRoot() {
  const desktop = path.join(os.homedir(), 'Desktop');
  try {
    if (fs.statSync(desktop).isDirectory()) return desktop;
  } catch {
    /* no Desktop — fall through */
  }
  return process.cwd();
}

function writeSubject(dir, ex) {
  fs.writeFileSync(path.join(dir, 'subject.txt'), (ex.subject || '') + '\n');
}

// Drop a stub so there is something to open and edit straight away. Never
// clobber work already in the folder.
function writeStub(dir, ex) {
  const file = path.join(dir, ex.solution_file);
  if (fs.existsSync(file)) return;
  const lines = [];
  if (ex.mode === 'function' && ex.signature) {
    lines.push(ex.signature);
    lines.push('    # your code here');
    lines.push('    pass');
  } else if (ex.lang === 'c') {
    lines.push('/* your code here */');
  } else {
    lines.push('# your code here');
  }
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

function setupExercise(sessionDir, step, index) {
  const dir = path.join(sessionDir, `ex${String(index).padStart(2, '0')}`);
  fs.mkdirSync(dir, { recursive: true });
  writeSubject(dir, step.exercise);
  writeStub(dir, step.exercise);
  return dir;
}

function rule(char = '─', width = 72) {
  return c.dim(char.repeat(width));
}

function showSubject(step, index, total, dir) {
  const ex = step.exercise;
  console.log('');
  console.log(rule('═'));
  console.log(
    `  ${c.bold(c.cyan(`Exercise ${index}`))}  ${c.dim('·')}  `
    + `${c.bold(ex.title)}  ${c.dim(`· level ${step.level} · ${index + 1}/${total}`)}`
  );
  console.log(rule('═'));
  console.log('');
  for (const line of (ex.subject || '').split('\n')) {
    console.log(`  ${line}`);
  }
  console.log(rule());
  console.log(`  ${c.dim(t('sim.folder'))} ${c.bold(dir)}`);
  console.log(`  ${c.dim(t('sim.editFile'))} ${c.bold(ex.solution_file)}`);
  console.log('');
}

function showHelp() {
  console.log('');
  console.log(`  ${c.bold('grademe')}  ${c.dim(t('sim.cmdGrademe'))}`);
  console.log(`  ${c.bold('subject')}  ${c.dim(t('sim.cmdSubject'))}`);
  console.log(`  ${c.bold('open')}     ${c.dim(t('sim.cmdOpen'))}`);
  console.log(`  ${c.bold('skip')}     ${c.dim(t('sim.cmdSkip'))}`);
  console.log(`  ${c.bold('quit')}     ${c.dim(t('sim.cmdQuit'))}`);
  console.log('');
}

// Open the exercise folder in the OS file manager — convenience only, a
// failure here must never interrupt the exam.
function openFolder(dir) {
  const { spawn } = require('child_process');
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'explorer'
      : 'xdg-open';
  try {
    spawn(cmd, [dir], { stdio: 'ignore', detached: true }).unref();
  } catch {
    console.log(`  ${c.yellow(t('sim.openFailed'))}`);
  }
}

function recordSession(results) {
  if (!results.length) return;
  const graded = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === graded;
  const maxLevelPassed = results
    .filter((r) => r.passed)
    .reduce((m, r) => Math.max(m, r.difficulty || 0), 0);
  stats.recordExam({ graded, passedCount, allPassed, maxLevelPassed });
  ach.announceNew(ach.evaluate({
    event: 'exam',
    graded,
    passedCount,
    allPassed,
    maxLevelPassed,
    now: new Date(),
  }));
}

function summary(sessionDir, results, ladder) {
  const passed = results.filter((r) => r.passed).length;
  console.log('');
  console.log(rule('═'));
  console.log(`  ${c.bold(t('sim.summaryTitle'))}`);
  console.log(rule('═'));
  console.log('');
  for (const r of results) {
    const mark = r.passed ? c.green('✓') : c.red('✗');
    console.log(`   ${mark}  ${c.dim(`level ${r.level}`)}  ${r.title}`);
  }
  console.log('');
  console.log(`  ${c.bold(t('sim.reached', { passed, total: ladder.length }))}`);
  console.log(`  ${c.dim(t('sim.workspaceKept'))} ${c.bold(sessionDir)}`);
  console.log('');
}

async function run(module, examCfg) {
  const cfg = examCfg || module.exam;

  if (!detectPython()) {
    console.log('');
    console.log(c.red(`  ✗ ${t('py.noPython')}`));
    console.log(c.yellow(`     ${t('py.noPythonHint')}`));
    console.log('');
    return 'back';
  }

  const bankExercises = grader.loadExam(cfg);
  if (!bankExercises.length) {
    console.log('');
    console.log(c.yellow(`  ${t('exam.bankEmpty')}`));
    console.log('');
    return 'back';
  }

  const ladder = buildLadder(bankExercises, { all: Boolean(cfg.tier) });
  const sessionDir = path.join(examRoot(), `42exam-${timestamp()}`);
  fs.mkdirSync(sessionDir, { recursive: true });

  console.log('');
  console.log(rule('═'));
  const examName = cfg.labelKey ? t(cfg.labelKey) : (cfg.label || cfg.banks[0]);
  console.log(`  ${c.bold(c.cyan(t('sim.title')))}  ${c.dim('· ' + examName)}`);
  console.log(rule('═'));
  console.log('');
  console.log(`  ${t('sim.intro1')}`);
  console.log(`  ${t('sim.intro2')}`);
  console.log('');
  console.log(`  ${c.dim(t('sim.created'))} ${c.bold(sessionDir)}`);
  showHelp();

  const results = [];
  const prompt = createPrompt();
  for (let i = 0; i < ladder.length; i++) {
    const step = ladder[i];
    const dir = setupExercise(sessionDir, step, i);
    showSubject(step, i, ladder.length, dir);

    let done = false;
    let quit = false;
    let attempts = 0;

    while (!done) {
      const answer = await prompt.ask(t('sim.prompt'));
      if (answer === null) {
        // stdin closed (Ctrl-D) — end the exam rather than spin
        quit = true;
        break;
      }
      const cmd = answer.toLowerCase();

      if (cmd === 'grademe' || cmd === 'g') {
        attempts++;
        // pooled exams span banks, so the exercise carries its own
        const spec = grader.specPath(step.exercise.bank, step.exercise.id);
        const r = await grader.gradeExercise(dir, spec);
        if (grader.passed(r)) {
          console.log(`  ${c.green(c.bold('✓ ' + t('sim.passed')))}`);
          console.log('');
          results.push({ ...step.exercise, level: step.level, passed: true, attempts });
          done = true;
        } else {
          // The harness already printed which case failed — that is the hint.
          console.log(`  ${c.yellow(t('sim.retry'))}`);
          console.log('');
        }
      } else if (cmd === 'subject' || cmd === 's') {
        showSubject(step, i, ladder.length, dir);
      } else if (cmd === 'open' || cmd === 'o') {
        openFolder(dir);
      } else if (cmd === 'skip') {
        results.push({ ...step.exercise, level: step.level, passed: false, attempts });
        console.log(`  ${c.yellow(t('sim.skipped'))}`);
        console.log('');
        done = true;
      } else if (cmd === 'quit' || cmd === 'q') {
        quit = true;
        done = true;
      } else if (cmd === 'help' || cmd === '?') {
        showHelp();
      } else if (cmd) {
        console.log(`  ${c.dim(t('sim.unknownCmd'))}`);
      }
    }

    if (quit) break;
  }
  prompt.close();

  recordSession(results);
  summary(sessionDir, results, ladder);
  return 'back';
}

module.exports = { run, buildLadder, examRoot };
