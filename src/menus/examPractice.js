'use strict';

const fs = require('fs');
const path = require('path');
const { select } = require('../ui/select');
const c = require('../ui/colors');
const grader = require('../runners/examGrader');
const lint = require('../runners/pyLint');
const { detectPython } = require('../runners/pyTester');
const { t } = require('../i18n');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

async function section(title, fn) {
  const dashes = '─'.repeat(Math.max(2, 56 - title.length));
  console.log('');
  console.log(`${c.dim('──')} ${c.cyan(title)} ${c.dim(dashes)}`);
  console.log('');
  await fn();
  console.log('');
}

// Fisher–Yates. Math.random() is fine in normal CLI code (the no-random rule
// only applies inside Workflow scripts); src/index.js uses it too.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampLevel(n) {
  const d = parseInt(n, 10);
  if (isNaN(d)) return 1;
  return Math.min(4, Math.max(1, d));
}

// Distribute difficulties 1→4 across N exercises, first easiest / last hardest.
function ascendingLevels(n) {
  if (n <= 1) return [1];
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(1 + Math.round((i * 3) / (n - 1)));
  }
  return out;
}

// Draw one unused exercise at `target` difficulty, falling back to the nearest
// available level (never repeats an exercise, never samples with replacement).
function drawNearest(byLevel, target, used) {
  for (let dist = 0; dist <= 3; dist++) {
    for (const lvl of dist === 0 ? [target] : [target - dist, target + dist]) {
      if (lvl < 1 || lvl > 4) continue;
      const ex = (byLevel[lvl] || []).find((e) => !used.has(e.id));
      if (ex) return ex;
    }
  }
  return null;
}

function selectExercises(bank, levels) {
  const byLevel = { 1: [], 2: [], 3: [], 4: [] };
  for (const ex of bank) byLevel[clampLevel(ex.difficulty)].push(ex);
  for (const k of Object.keys(byLevel)) byLevel[k] = shuffle(byLevel[k]);

  const used = new Set();
  const picked = [];
  for (const target of levels) {
    const ex = drawNearest(byLevel, target, used);
    if (ex) {
      used.add(ex.id);
      picked.push({ ...ex, assignedLevel: target });
    }
  }
  return picked;
}

function workspaceName(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `exam-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`
    + `-${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

function writeSubject(folderDir, ex) {
  const lines = [];
  lines.push(`${ex.title}`);
  lines.push(`difficulty: ${ex.difficulty}/4   ·   language: ${ex.lang}`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(ex.subject || '');
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push(`Create your solution in this folder as: ${ex.solution_file}`);
  fs.writeFileSync(path.join(folderDir, 'subject.txt'), lines.join('\n') + '\n');
}

// Build the exam workspace under the cwd; never clobber existing files.
function createWorkspace(module, picked, bank) {
  const dir = path.join(process.cwd(), workspaceName());
  fs.mkdirSync(dir, { recursive: true });

  const manifest = [];
  picked.forEach((ex, i) => {
    const folder = `ex${String(i).padStart(2, '0')}`;
    const folderDir = path.join(dir, folder);
    fs.mkdirSync(folderDir, { recursive: true });
    writeSubject(folderDir, ex);
    manifest.push({
      folder,
      specId: ex.id,
      bank,
      title: ex.title,
      difficulty: ex.difficulty,
      lang: ex.lang,
      solution_file: ex.solution_file,
    });
  });
  fs.writeFileSync(path.join(dir, '.exam.json'), JSON.stringify({ module: module.id, entries: manifest }, null, 2));
  return { dir, entries: manifest };
}

async function gradeEntry(session, entry) {
  const exerciseDir = path.join(session.dir, entry.folder);
  const spec = grader.specPath(entry.bank, entry.specId);
  const label = `${entry.folder} · ${entry.title} (${entry.difficulty}/4)`;
  let passed = false;
  await section(label, async () => {
    const r = await grader.gradeExercise(exerciseDir, spec);
    const s = grader.summarize(r);
    if (s) console.log(s);
    passed = grader.passed(r);
  });
  return passed;
}

function recordExamResult(entries, results) {
  const graded = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = graded > 0 && passedCount === graded;
  const maxLevelPassed = results
    .filter((r) => r.passed)
    .reduce((m, r) => Math.max(m, r.difficulty || 0), 0);

  stats.recordExam({ graded, passedCount, allPassed, maxLevelPassed });
  const newly = ach.evaluate({
    event: 'exam',
    graded,
    passedCount,
    allPassed,
    maxLevelPassed,
    now: new Date(),
  });
  ach.announceNew(newly);
}

async function pickConfig() {
  const count = await select({
    message: t('exam.pickCount'),
    choices: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
      { label: '5', value: '5' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (count === 'back') return null;
  const n = parseInt(count, 10);

  const mode = await select({
    message: t('exam.pickMode'),
    choices: [
      { label: t('exam.modeAscending'), value: 'asc' },
      { label: t('exam.modeFixed'), value: 'fixed' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (mode === 'back') return null;

  let levels;
  if (mode === 'asc') {
    levels = ascendingLevels(n);
  } else {
    const lvl = await select({
      message: t('exam.pickLevel'),
      choices: [
        { label: t('exam.level', { n: 1 }), value: '1' },
        { label: t('exam.level', { n: 2 }), value: '2' },
        { label: t('exam.level', { n: 3 }), value: '3' },
        { label: t('exam.level', { n: 4 }), value: '4' },
        { label: t('common.back'), value: 'back' },
      ],
    });
    if (lvl === 'back') return null;
    levels = new Array(n).fill(parseInt(lvl, 10));
  }
  return { n, levels };
}

async function startExam(module, bankExercises, bank) {
  const cfg = await pickConfig();
  if (!cfg) return null;

  const picked = selectExercises(bankExercises, cfg.levels);
  if (!picked.length) {
    console.log(c.red(`  ${t('exam.noExercises')}`));
    return null;
  }
  if (picked.length < cfg.n) {
    console.log(c.yellow(`  ${t('exam.fewerThanRequested', { got: picked.length, want: cfg.n })}`));
  }

  const session = createWorkspace(module, picked, bank);
  console.log('');
  console.log(`  ${c.green('✓')} ${t('exam.created')}`);
  console.log(`  ${c.dim(session.dir)}`);
  console.log('');
  session.entries.forEach((e) => {
    console.log(`    ${c.cyan(e.folder)}  ${e.title} ${c.dim(`(${e.difficulty}/4)`)} → ${c.bold(e.solution_file)}`);
  });
  console.log('');
  console.log(`  ${c.dim(t('exam.instructions'))}`);
  console.log('');
  return session;
}

// flake8 / mypy over the Python exam solutions, one section per exercise.
// flake8 lints the exercise folder (only the solution .py lives there); mypy
// type-checks the declared solution file. Mirrors the project lint menu.
async function lintAll(session, tool) {
  const pyEntries = session.entries.filter((e) => e.lang === 'python');
  if (!pyEntries.length) return;
  for (const entry of pyEntries) {
    const dir = path.join(session.dir, entry.folder);
    await section(`${tool} · ${entry.folder} · ${entry.title}`, async () => {
      if (tool === 'mypy') {
        const r = await lint.runMypy(dir, [entry.solution_file]);
        console.log(lint.summarize(r));
      } else {
        const r = await lint.runFlake8(dir);
        console.log(lint.summarize(r));
      }
    });
  }
}

async function gradeAll(session) {
  const results = [];
  for (const entry of session.entries) {
    const passed = await gradeEntry(session, entry);
    results.push({ ...entry, passed });
  }
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`  ${c.bold(t('exam.summaryLine', { passed: passedCount, total: results.length }))}`);
  console.log('');
  recordExamResult(session.entries, results);
}

async function gradeOne(session) {
  const choices = session.entries.map((e) => ({
    label: `${e.folder} · ${e.title} ${c.dim(`(${e.difficulty}/4)`)}`,
    value: e.folder,
  }));
  choices.push({ label: t('common.back'), value: 'back' });
  const pick = await select({ message: t('exam.pickExercise'), choices });
  if (pick === 'back') return;
  const entry = session.entries.find((e) => e.folder === pick);
  if (!entry) return;
  const passed = await gradeEntry(session, entry);
  recordExamResult([entry], [{ ...entry, passed }]);
}

function showSubjects(session) {
  for (const e of session.entries) {
    const file = path.join(session.dir, e.folder, 'subject.txt');
    try {
      console.log('');
      console.log(fs.readFileSync(file, 'utf8'));
    } catch {
      /* ignore */
    }
  }
}

async function run(module, examCfg) {
  const { lang, bank } = examCfg || module.exam;

  if (!detectPython()) {
    console.log('');
    console.log(c.red(`  ✗ ${t('py.noPython')}`));
    console.log(c.yellow(`     ${t('py.noPythonHint')}`));
  }
  if (lang === 'c' && !grader.detectCC()) {
    console.log('');
    console.log(c.red(`  ✗ ${t('exam.noCC')}`));
    console.log(c.yellow(`     ${t('exam.noCCHint')}`));
  }

  const bankExercises = grader.loadBank(bank);
  if (!bankExercises.length) {
    console.log('');
    console.log(c.yellow(`  ${t('exam.bankEmpty')}`));
    console.log('');
    return 'back';
  }

  console.log('');
  console.log(`  ${c.dim(t('exam.intro'))}`);

  let session = null;
  while (true) {
    const choices = [];
    choices.push({ label: session ? t('exam.newExam') : t('exam.start'), value: 'start' });
    if (session) {
      choices.push({ label: t('exam.gradeAll'), value: 'gradeAll' });
      choices.push({ label: t('exam.gradeOne'), value: 'gradeOne' });
      if (lang === 'python') {
        choices.push({ label: t('py.runFlake8'), value: 'flake8' });
        choices.push({ label: t('py.runMypy'), value: 'mypy' });
      }
      choices.push({ label: t('exam.showSubjects'), value: 'subjects' });
    }
    choices.push({ label: t('common.back'), value: 'back' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const action = await select({ message: t('exam.action'), choices });

    if (action === 'start') {
      const s = await startExam(module, bankExercises, bank);
      if (s) session = s;
    } else if (action === 'gradeAll') {
      await gradeAll(session);
    } else if (action === 'gradeOne') {
      await gradeOne(session);
    } else if (action === 'flake8') {
      await lintAll(session, 'flake8');
    } else if (action === 'mypy') {
      await lintAll(session, 'mypy');
    } else if (action === 'subjects') {
      showSubjects(session);
    } else if (action === 'back') {
      return 'back';
    } else if (action === 'quit') {
      return 'quit';
    }
  }
}

module.exports = { run, ascendingLevels, selectExercises };
