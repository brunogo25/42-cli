'use strict';

const { select } = require('../ui/select');
const { input } = require('../ui/input');
const c = require('../ui/colors');
const { isGnlDir, resolveLibftPath } = require('../utils/projectDetect');
const tester = require('../runners/gnlTester');
const norm = require('../runners/norminette');
const { t } = require('../i18n');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

function recordTesterResult(result) {
  const passed = result && result.exitCode === 0 && result.stage === 'run';
  stats.recordTestRun({ targets: ['get_next_line'], passed });
  ach.announceNew(ach.evaluate({
    event: 'test',
    targets: ['get_next_line'],
    passed,
    now: new Date(),
  }));
}

function recordNormResult(result) {
  const clean = result && result.exitCode === 0;
  stats.recordNorminetteRun({ clean });
  ach.announceNew(ach.evaluate({ event: 'norminette', clean, now: new Date() }));
}

async function promptForCustomPath() {
  while (true) {
    const raw = await input({ message: t('gnl.pathPrompt') });
    if (!raw) return null;
    const abs = resolveLibftPath(raw);
    if (!isGnlDir(abs)) {
      console.log(c.red(`  ✗ ${abs}`));
      console.log(c.yellow(`     ${t('gnl.notProject')}`));
      continue;
    }
    return abs;
  }
}

async function pickPath() {
  const cwd = process.cwd();
  const here = await select({
    message: t('gnl.areYouHere', { cwd }),
    choices: [
      { label: t('gnl.useThisDir'), value: 'yes' },
      { label: t('gnl.enterPath'), value: 'no' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (here === 'back') return null;
  if (here === 'yes') {
    if (isGnlDir(cwd)) return cwd;
    console.log(c.red(`  ✗ ${cwd}`));
    console.log(c.yellow(`     ${t('gnl.notProject')}`));
    console.log(c.dim(`     ${t('gnl.fallbackToPathEntry')}`));
  }
  return promptForCustomPath();
}

async function promptCustomBuffer() {
  while (true) {
    const raw = await input({ message: t('gnl.customBufferPrompt') });
    if (!raw) return null;
    const n = Number(raw.trim());
    if (!Number.isInteger(n) || n < 1) {
      console.log(c.red(`  ✗ ${t('gnl.customBufferInvalid')}`));
      continue;
    }
    return n;
  }
}

async function section(title, fn) {
  const dashes = '─'.repeat(Math.max(2, 56 - title.length));
  console.log('');
  console.log(`${c.dim('──')} ${c.cyan(title)} ${c.dim(dashes)}`);
  console.log('');
  await fn();
  console.log('');
}

async function run() {
  const projPath = await pickPath();
  if (!projPath) return 'back';
  console.log(`  ${c.dim(t('gnl.pathLabel'))} ${projPath}`);

  while (true) {
    const action = await select({
      message: t('gnl.action'),
      choices: [
        { label: t('gnl.runTests'), value: 'tests' },
        { label: t('gnl.runTestsCustomBuffer'), value: 'testsCustom' },
        { label: t('gnl.runNorm'), value: 'norm' },
        { label: t('gnl.runNormAndTests'), value: 'both' },
        { label: t('gnl.changePath'), value: 'path' },
        { label: t('common.back'), value: 'back' },
        { label: t('common.quit'), value: 'quit' },
      ],
    });

    if (action === 'tests') {
      await section(t('sections.gnlTests'), async () => {
        const r = await tester.runTester(projPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(r);
      });
    } else if (action === 'testsCustom') {
      const bs = await promptCustomBuffer();
      if (bs == null) continue;
      await section(t('sections.gnlTestsCustom', { size: bs }), async () => {
        const r = await tester.runTester(projPath, { bufferSizes: [bs] });
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(r);
      });
    } else if (action === 'norm') {
      await section(t('sections.norminette'), async () => {
        const r = await norm.runNorminetteRecursive(projPath);
        console.log(norm.summarize(r));
        recordNormResult(r);
      });
    } else if (action === 'both') {
      await section(t('sections.norminette'), async () => {
        const n = await norm.runNorminetteRecursive(projPath);
        console.log(norm.summarize(n));
        recordNormResult(n);
      });
      await section(t('sections.gnlTests'), async () => {
        const r = await tester.runTester(projPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(r);
      });
    } else if (action === 'path') {
      return run();
    } else if (action === 'back') {
      return 'back';
    } else if (action === 'quit') {
      return 'quit';
    }
  }
}

module.exports = { run };
