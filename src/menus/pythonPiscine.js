'use strict';

const path = require('path');
const { select } = require('../ui/select');
const { input } = require('../ui/input');
const c = require('../ui/colors');
const { resolveLibftPath } = require('../utils/projectDetect');
const garbage = require('../utils/garbage');
const tester = require('../runners/pyTester');
const lint = require('../runners/pyLint');
const { PROJECTS } = require('../data/pythonProjects');
const { t } = require('../i18n');

async function section(title, fn) {
  const dashes = '─'.repeat(Math.max(2, 56 - title.length));
  console.log('');
  console.log(`${c.dim('──')} ${c.cyan(title)} ${c.dim(dashes)}`);
  console.log('');
  await fn();
  console.log('');
}

async function promptForCustomPath(spec) {
  while (true) {
    const raw = await input({ message: t('py.pathPrompt') });
    if (!raw) return null;
    const abs = resolveLibftPath(raw);
    if (!tester.hasAnyExercise(abs, spec)) {
      console.log(c.red(`  ✗ ${abs}`));
      console.log(c.yellow(`     ${t('py.notProject')}`));
      continue;
    }
    return abs;
  }
}

async function pickPath(spec) {
  const cwd = process.cwd();
  const here = await select({
    message: t('py.areYouHere', { cwd }),
    choices: [
      { label: t('py.useThisDir'), value: 'yes' },
      { label: t('py.enterPath'), value: 'no' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (here === 'back') return null;
  if (here === 'yes') {
    if (tester.hasAnyExercise(cwd, spec)) return cwd;
    console.log(c.red(`  ✗ ${cwd}`));
    console.log(c.yellow(`     ${t('py.notProject')}`));
    console.log(c.dim(`     ${t('py.fallbackToPathEntry')}`));
  }
  return promptForCustomPath(spec);
}

async function pickExercise(projectDir, spec) {
  const { present } = tester.listImplemented(projectDir, spec);
  const presentIds = new Set(present.map((ex) => ex.id));
  const choices = spec.exercises.map((ex) => ({
    label: `${ex.id} · ${ex.title}`,
    value: ex.id,
    disabled: presentIds.has(ex.id) ? undefined : t('py.exMissing'),
  }));
  choices.push({ label: t('common.back'), value: 'back' });
  const choice = await select({ message: t('py.pickExercise'), choices });
  return choice === 'back' ? null : choice;
}

// Lists the garbage (__pycache__, .mypy_cache, .pyc, .DS_Store…), asks, deletes.
async function cleanGarbage(projectDir) {
  const found = garbage.findGarbage(projectDir);
  if (!found.length) {
    console.log(c.green(`  ✓ ${t('py.cleanNothing')}`));
    return;
  }
  for (const p of found) console.log(c.dim(`  ${path.relative(projectDir, p)}`));
  console.log('');
  const ok = await select({
    message: t('py.cleanConfirm', { n: found.length }),
    choices: [
      { label: t('common.yes'), value: 'yes' },
      { label: t('common.no'), value: 'no' },
    ],
  });
  if (ok !== 'yes') return;
  garbage.removeGarbage(found);
  console.log(c.green(`  ✓ ${t('py.cleanDone', { n: found.length })}`));
}

async function projectMenu(project) {
  let spec;
  try {
    spec = tester.loadSpec(project.spec);
  } catch (err) {
    console.log(c.red(`  ✗ could not load tester spec for ${project.title}: ${err.message}`));
    return 'back';
  }

  if (!tester.detectPython()) {
    console.log('');
    console.log(c.red(`  ✗ ${t('py.noPython')}`));
    console.log(c.yellow(`     ${t('py.noPythonHint')}`));
    console.log('');
  }

  const projectDir = await pickPath(spec);
  if (!projectDir) return 'back';
  console.log(`  ${c.dim(t('py.pathLabel'))} ${projectDir}`);

  const hasMypy = !!project.mypy;

  while (true) {
    const choices = [
      { label: t('py.testAll'), value: 'all' },
      { label: t('py.testOne'), value: 'one' },
      { label: t('py.runFlake8'), value: 'flake8' },
    ];
    if (hasMypy) choices.push({ label: t('py.runMypy'), value: 'mypy' });
    choices.push({ label: t('py.runLintAndTests'), value: 'both' });
    choices.push({ label: t('py.cleanGarbage'), value: 'clean' });
    choices.push({ label: t('py.changePath'), value: 'path' });
    choices.push({ label: t('common.back'), value: 'back' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const action = await select({
      message: t('py.action', { title: project.title }),
      choices,
    });

    if (action === 'all') {
      await section(`tests · ${project.title}`, async () => {
        const r = await tester.runTester(projectDir, project.spec);
        const s = tester.summarize(r);
        if (s) console.log(s);
      });
    } else if (action === 'one') {
      const ex = await pickExercise(projectDir, spec);
      if (!ex) continue;
      await section(`tests · ${project.title} · ${ex}`, async () => {
        const r = await tester.runTester(projectDir, project.spec, { exercise: ex });
        const s = tester.summarize(r);
        if (s) console.log(s);
      });
    } else if (action === 'flake8') {
      await section('flake8', async () => {
        const r = await lint.runFlake8(projectDir);
        console.log(lint.summarize(r));
      });
    } else if (action === 'mypy') {
      await section('mypy', async () => {
        const targets = Array.isArray(project.mypy) ? project.mypy : null;
        const r = await lint.runMypy(projectDir, targets);
        console.log(lint.summarize(r));
      });
    } else if (action === 'both') {
      await section('flake8', async () => {
        const r = await lint.runFlake8(projectDir);
        console.log(lint.summarize(r));
      });
      if (hasMypy) {
        await section('mypy', async () => {
          const targets = Array.isArray(project.mypy) ? project.mypy : null;
          const r = await lint.runMypy(projectDir, targets);
          console.log(lint.summarize(r));
        });
      }
      await section(`tests · ${project.title}`, async () => {
        const r = await tester.runTester(projectDir, project.spec);
        const s = tester.summarize(r);
        if (s) console.log(s);
      });
    } else if (action === 'clean') {
      await section(t('py.cleanGarbage'), () => cleanGarbage(projectDir));
    } else if (action === 'path') {
      return projectMenu(project);
    } else if (action === 'back') {
      return 'back';
    } else if (action === 'quit') {
      return 'quit';
    }
  }
}

async function run() {
  while (true) {
    const choices = PROJECTS.map((p) => ({
      label: `${p.title} ${c.dim('— ' + p.subtitle)}`,
      value: p.id,
    }));
    choices.push({ label: t('common.back'), value: 'back' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const choice = await select({ message: t('py.pickProject'), choices });
    if (choice === 'back') return 'back';
    if (choice === 'quit') return 'quit';

    const project = PROJECTS.find((p) => p.id === choice);
    if (!project) continue;
    const back = await projectMenu(project);
    if (back === 'quit') return 'quit';
  }
}

module.exports = { run, projectMenu };
