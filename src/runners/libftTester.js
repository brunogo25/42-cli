'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const c = require('../ui/colors');

const TESTER_DIR = path.join(__dirname, '..', '..', 'resources', 'tester');
const TESTER_BIN = path.join(TESTER_DIR, '42_tester');

const FUNCTIONS = [
  'isalpha', 'isdigit', 'isalnum', 'isascii', 'isprint',
  'toupper', 'tolower',
  'strlen', 'strchr', 'strrchr', 'strncmp', 'strnstr', 'strdup',
  'memset', 'bzero', 'memcpy', 'memmove', 'memchr', 'memcmp',
  'strlcpy', 'strlcat',
  'atoi', 'calloc', 'itoa',
  'substr', 'strjoin', 'strtrim', 'split', 'strmapi', 'striteri',
  'putchar_fd', 'putstr_fd', 'putendl_fd', 'putnbr_fd',
  'lstnew', 'lstadd_front', 'lstsize', 'lstlast', 'lstadd_back',
  'lstdelone', 'lstclear', 'lstiter', 'lstmap',
];

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
    child.on('error', (err) => {
      resolve({ exitCode: 1, stdout, stderr, error: err });
    });
    child.on('close', (code) => {
      resolve({ exitCode: code, stdout, stderr });
    });
  });
}

async function build(libftPath) {
  const opts = {
    stdio: ['ignore', 'pipe', 'pipe'],
    streamStdout: false,
    streamStderr: false,
  };
  return spawnAsync('make', ['-C', TESTER_DIR, `LIBFT_PATH=${libftPath}`, 'build'], opts);
}

function findMainOffenders(libftPath) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(libftPath); } catch { return out; }
  for (const f of entries) {
    if (!/^ft_.*\.c$/.test(f)) continue;
    let text;
    try { text = fs.readFileSync(path.join(libftPath, f), 'utf8'); } catch { continue; }
    if (/^\s*(int|void)\s+main\s*\(/m.test(text)) out.push(f);
  }
  return out;
}

async function runTester(libftPath, targets) {
  if (!fs.existsSync(path.join(TESTER_DIR, 'tester.c'))) {
    return {
      exitCode: 1,
      stage: 'setup',
      error: `Bundled tester source not found at ${TESTER_DIR}`,
    };
  }

  process.stdout.write(c.dim('  building libft + tester…\n'));
  const built = await build(libftPath);
  if (built.exitCode !== 0) {
    const log = (built.stderr || '') + (built.stdout || '');
    const dupMain = /duplicate symbol .*_main/i.test(log);
    return {
      exitCode: built.exitCode,
      stage: 'build',
      stdout: built.stdout,
      stderr: built.stderr,
      error: built.error,
      mainOffenders: dupMain ? findMainOffenders(libftPath) : [],
    };
  }

  process.stdout.write('\n');
  const args = Array.isArray(targets) ? targets : (targets ? [targets] : []);
  const run = await spawnAsync(TESTER_BIN, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: TESTER_DIR,
  });
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
    lines.push('', `${c.bold('Result:')} ${c.red('FAIL')}`);
    lines.push(`  ${c.red(result.error || 'tester missing')}`);
    return lines.join('\n');
  }
  if (result.stage === 'build') {
    lines.push('', `${c.bold('Result:')} ${c.red('FAIL — build error')}`);
    if (result.mainOffenders && result.mainOffenders.length > 0) {
      lines.push(
        `  ${c.yellow('cause:')} found ${c.bold('main()')} in ${c.bold(result.mainOffenders.join(', '))}`
      );
      lines.push(
        `  ${c.yellow('why:')}   libft.a must be a library only — the linker sees two main()s ` +
          '(yours + the tester) and refuses.'
      );
      lines.push(
        `  ${c.dim('see "Subject compliance check" in the menu for the same finding.')}`
      );
      return lines.join('\n');
    }
    const buildOut = (result.stderr && result.stderr.trim()) || (result.stdout && result.stdout.trim());
    if (buildOut) {
      lines.push(c.yellow('  build output (last 12 lines):'));
      buildOut.split('\n').slice(-12).forEach((l) => lines.push(`    ${c.dim(l)}`));
    }
    lines.push(
      c.yellow('  hint:') +
        ' make sure all 42 ft_* functions are implemented and the Makefile builds libft.a.'
    );
    return lines.join('\n');
  }
  // run stage — the C tester already printed its own pretty summary.
  // Just confirm with exit code (0 = PASS, 1 = FAIL, 2 = no match).
  if (result.exitCode === 2) {
    return (
      `\n${c.bold('Result:')} ${c.yellow('no tests matched')}\n` +
      c.yellow('  hint:') + ' check the function name (use ft_strlen or strlen).'
    );
  }
  return ''; // tester output speaks for itself
}

module.exports = { runTester, summarize, FUNCTIONS, TESTER_DIR };
