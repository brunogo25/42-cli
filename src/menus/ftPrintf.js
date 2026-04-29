'use strict';

const { select } = require('../ui/select');
const { input } = require('../ui/input');
const c = require('../ui/colors');
const { isFtPrintfDir, resolveLibftPath } = require('../utils/projectDetect');
const tester = require('../runners/ftPrintfTester');
const norm = require('../runners/norminette');
const compliance = require('../runners/ftPrintfSubjectCheck');
const { t } = require('../i18n');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

function recordTesterResult(result) {
  const passed = result && result.exitCode === 0 && result.stage === 'run';
  stats.recordTestRun({ targets: ['ft_printf'], passed });
  ach.announceNew(ach.evaluate({
    event: 'test',
    targets: ['ft_printf'],
    passed,
    now: new Date(),
  }));
}

function recordNormResult(result) {
  const clean = result && result.exitCode === 0;
  stats.recordNorminetteRun({ clean });
  ach.announceNew(ach.evaluate({ event: 'norminette', clean, now: new Date() }));
}

function recordComplianceResult() {
  stats.recordComplianceRun();
  ach.announceNew(ach.evaluate({ event: 'compliance', now: new Date() }));
}

async function promptForCustomPath() {
  while (true) {
    const raw = await input({ message: t('printf.pathPrompt') });
    if (!raw) return null;
    const abs = resolveLibftPath(raw);
    if (!isFtPrintfDir(abs)) {
      console.log(c.red(`  ✗ ${abs}`));
      console.log(c.yellow(`     ${t('printf.notProject')}`));
      continue;
    }
    return abs;
  }
}

async function pickPath() {
  const cwd = process.cwd();
  const here = await select({
    message: t('printf.areYouHere', { cwd }),
    choices: [
      { label: t('printf.useThisDir'), value: 'yes' },
      { label: t('printf.enterPath'), value: 'no' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (here === 'back') return null;
  if (here === 'yes') {
    if (isFtPrintfDir(cwd)) return cwd;
    console.log(c.red(`  ✗ ${cwd}`));
    console.log(c.yellow(`     ${t('printf.notProject')}`));
    console.log(c.dim(`     ${t('printf.fallbackToPathEntry')}`));
  }
  return promptForCustomPath();
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
  console.log(`  ${c.dim(t('printf.pathLabel'))} ${projPath}`);

  while (true) {
    const action = await select({
      message: t('printf.action'),
      choices: [
        { label: t('printf.runTests'), value: 'tests' },
        { label: t('printf.runNorm'), value: 'norm' },
        { label: t('printf.runNormAndTests'), value: 'both' },
        { label: t('printf.compliance'), value: 'compliance' },
        { label: t('printf.changePath'), value: 'path' },
        { label: t('common.back'), value: 'back' },
        { label: t('common.quit'), value: 'quit' },
      ],
    });

    if (action === 'tests') {
      await section(t('sections.printfTests'), async () => {
        const r = await tester.runTester(projPath);
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
      await section(t('sections.printfTests'), async () => {
        const r = await tester.runTester(projPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(r);
      });
    } else if (action === 'compliance') {
      await section(t('sections.compliance'), async () => {
        const checks = await compliance.runCompliance(projPath);
        console.log(compliance.summarize(checks));
        recordComplianceResult();
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
