'use strict';

const { select } = require('../ui/select');
const { input } = require('../ui/input');
const c = require('../ui/colors');
const { isLibftDir, resolveLibftPath } = require('../utils/projectDetect');
const tester = require('../runners/libftTester');
const norm = require('../runners/norminette');
const compliance = require('../runners/subjectCheck');

async function promptForCustomPath() {
  while (true) {
    const raw = await input({ message: 'Path to libft directory:' });
    if (!raw) return null;
    const abs = resolveLibftPath(raw);
    if (!isLibftDir(abs)) {
      console.log(c.red(`  ✗ ${abs}`));
      console.log(
        c.yellow('     not a libft project — needs Makefile, libft.h, and ft_*.c at the root.')
      );
      continue;
    }
    return abs;
  }
}

async function pickLibftPath() {
  const cwd = process.cwd();
  const here = await select({
    message: `Are you in your libft directory? ${c.dim(`(${cwd})`)}`,
    choices: [
      { label: 'Yes — use this directory', value: 'yes' },
      { label: 'No — enter a path', value: 'no' },
      { label: 'Back', value: 'back' },
    ],
  });
  if (here === 'back') return null;
  if (here === 'yes') {
    if (isLibftDir(cwd)) return cwd;
    console.log(c.red(`  ✗ ${cwd}`));
    console.log(
      c.yellow('     not a libft project — needs Makefile, libft.h, and ft_*.c at the root.')
    );
    console.log(c.dim('     falling back to path entry.'));
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
    const raw = await input({
      message:
        'Functions to test (comma/space separated, ft_ prefix optional, blank to cancel):',
    });
    if (!raw) return null;
    if (raw.trim().toLowerCase() === 'list') {
      // Print the catalog and re-prompt.
      console.log(c.dim('  available functions:'));
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
      console.log(c.red(`  ✗ unknown function(s): ${unknown.join(', ')}`));
      console.log(
        c.yellow(`     try: type "list" to see the catalog, or check the ft_ prefix.`)
      );
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
  console.log(`  ${c.dim('libft path:')} ${libftPath}`);

  while (true) {
    const action = await select({
      message: `Libft — what do you want to do?`,
      choices: [
        { label: 'Test all 42 functions', value: 'all' },
        { label: 'Test specific functions… (type names)', value: 'pick' },
        { label: 'Run Norminette', value: 'norm' },
        { label: 'Run Norminette + all tests', value: 'both' },
        { label: 'Subject compliance check (files / Makefile / header)', value: 'compliance' },
        { label: 'Change libft path', value: 'path' },
        { label: 'Back', value: 'back' },
        { label: 'Quit', value: 'quit' },
      ],
    });

    if (action === 'all') {
      await section('tests · all 42 functions', async () => {
        const r = await tester.runTester(libftPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
      });
    } else if (action === 'pick') {
      const fns = await promptFunctions();
      if (!fns) continue;
      const label = fns.length === 1 ? `ft_${fns[0]}` : `${fns.length} functions`;
      await section(`tests · ${label}`, async () => {
        const r = await tester.runTester(libftPath, fns);
        const s = tester.summarize(r);
        if (s) console.log(s);
      });
    } else if (action === 'norm') {
      await section('norminette', async () => {
        const r = await norm.runNorminette(libftPath);
        console.log(norm.summarize(r));
      });
    } else if (action === 'both') {
      await section('norminette', async () => {
        const n = await norm.runNorminette(libftPath);
        console.log(norm.summarize(n));
      });
      await section('tests · all 42 functions', async () => {
        const r = await tester.runTester(libftPath);
        const s = tester.summarize(r);
        if (s) console.log(s);
      });
    } else if (action === 'compliance') {
      await section('subject compliance', async () => {
        const checks = await compliance.runCompliance(libftPath);
        console.log(compliance.summarize(checks));
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
