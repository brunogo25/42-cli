'use strict';

const { select } = require('../ui/select');
const { input } = require('../ui/input');
const c = require('../ui/colors');
const { isLibftDir, resolveLibftPath } = require('../utils/projectDetect');
const tester = require('../runners/libftTester');
const norm = require('../runners/norminette');
const compliance = require('../runners/subjectCheck');
const { t } = require('../i18n');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

function presentImplementedTargets(libftPath) {
  try {
    return tester.detectImplemented
      ? tester.detectImplemented(libftPath).present
      : tester.FUNCTIONS;
  } catch {
    return tester.FUNCTIONS;
  }
}

function recordTesterResult(libftPath, targets, result) {
  const passed = result && result.exitCode === 0 && result.stage === 'run';
  const effective = Array.isArray(targets) && targets.length
    ? targets
    : presentImplementedTargets(libftPath);
  stats.recordTestRun({ targets: effective, passed });
  const newly = ach.evaluate({
    event: 'test',
    targets: effective,
    passed,
    now: new Date(),
  });
  ach.announceNew(newly);
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
    const raw = await input({ message: t('libft.pathPrompt') });
    if (!raw) return null;
    const abs = resolveLibftPath(raw);
    if (!isLibftDir(abs)) {
      console.log(c.red(`  ✗ ${abs}`));
      console.log(c.yellow(`     ${t('libft.notLibft')}`));
      continue;
    }
    return abs;
  }
}

async function pickLibftPath() {
  const cwd = process.cwd();
  const here = await select({
    message: t('libft.areYouHere', { cwd }),
    choices: [
      { label: t('libft.useThisDir'), value: 'yes' },
      { label: t('libft.enterPath'), value: 'no' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (here === 'back') return null;
  if (here === 'yes') {
    if (isLibftDir(cwd)) return cwd;
    console.log(c.red(`  ✗ ${cwd}`));
    console.log(c.yellow(`     ${t('libft.notLibft')}`));
    console.log(c.dim(`     ${t('libft.fallbackToPathEntry')}`));
  }
  return promptForCustomPath();
}

function parseFunctionList(raw) {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith('ft_') ? s.slice(3) : s));
}

function validateFunctionList(names) {
  const known = new Set(tester.FUNCTIONS);
  const valid = [];
  const unknown = [];
  for (const n of names) {
    if (known.has(n)) valid.push(n);
    else unknown.push(n);
  }
  return { valid, unknown };
}

async function promptFunctions() {
  while (true) {
    const raw = await input({ message: t('libft.functionsPrompt') });
    if (!raw) return null;
    if (raw.trim().toLowerCase() === 'list') {
      console.log(c.dim(`  ${t('libft.catalogHeader')}`));
      const cols = 4;
      for (let i = 0; i < tester.FUNCTIONS.length; i += cols) {
        const row = tester.FUNCTIONS.slice(i, i + cols)
          .map((f) => `ft_${f}`.padEnd(18))
          .join(' ');
        console.log(`    ${row}`);
      }
      continue;
    }
    const parsed = parseFunctionList(raw);
    if (parsed.length === 0) return null;
    const { valid, unknown } = validateFunctionList(parsed);
    if (unknown.length > 0) {
      console.log(c.red(`  ✗ ${t('libft.unknownFunctions', { names: unknown.join(', ') })}`));
      console.log(c.yellow(`     ${t('libft.tryListHint')}`));
      continue;
    }
    return valid;
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
  const libftPath = await pickLibftPath();
  if (!libftPath) return 'back';
  console.log(`  ${c.dim(t('libft.pathLabel'))} ${libftPath}`);

  while (true) {
    const action = await select({
      message: t('libft.action'),
      choices: [
        { label: t('libft.testAll'), value: 'all' },
        { label: t('libft.testPick'), value: 'pick' },
        { label: t('libft.runNorm'), value: 'norm' },
        { label: t('libft.runNormAndTests'), value: 'both' },
        { label: t('libft.compliance'), value: 'compliance' },
        { label: t('libft.changePath'), value: 'path' },
        { label: t('common.back'), value: 'back' },
        { label: t('common.quit'), value: 'quit' },
      ],
    });

    if (action === 'all') {
      await section(t('sections.testsAll'), async () => {
        const r = await tester.runTester(libftPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(libftPath, null, r);
      });
    } else if (action === 'pick') {
      const fns = await promptFunctions();
      if (!fns) continue;
      const label = fns.length === 1 ? `ft_${fns[0]}` : `${fns.length} functions`;
      await section(`tests · ${label}`, async () => {
        const r = await tester.runTester(libftPath, fns);
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(libftPath, fns, r);
      });
    } else if (action === 'norm') {
      await section(t('sections.norminette'), async () => {
        const r = await norm.runNorminette(libftPath);
        console.log(norm.summarize(r));
        recordNormResult(r);
      });
    } else if (action === 'both') {
      await section(t('sections.norminette'), async () => {
        const n = await norm.runNorminette(libftPath);
        console.log(norm.summarize(n));
        recordNormResult(n);
      });
      await section(t('sections.testsAll'), async () => {
        const r = await tester.runTester(libftPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
        recordTesterResult(libftPath, null, r);
      });
    } else if (action === 'compliance') {
      await section(t('sections.compliance'), async () => {
        const checks = await compliance.runCompliance(libftPath);
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
