'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const c = require('../ui/colors');

const TESTER_DIR = path.join(__dirname, '..', '..', 'resources', 'printf-tester');
const TESTER_BIN = path.join(TESTER_DIR, '42_printf_tester');

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

function stripCComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function detectImplemented(printfPath) {
  let header = '';
  try {
    header = stripCComments(fs.readFileSync(path.join(printfPath, 'ft_printf.h'), 'utf8'));
  } catch {
    return false;
  }
  return /\bft_printf\s*\(/.test(header);
}

// Recursively find any .c file with a main() — for the duplicate-main-on-link
// diagnostic. Skips .git, hidden dirs, and a libft/ bundle (treating its
// contents as out-of-scope for this project's submission rules).
function findMainOffenders(printfPath) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === '.git' || e.name === 'libft' || e.name.startsWith('.')) continue;
        walk(full, depth + 1);
      } else if (/\.c$/.test(e.name)) {
        try {
          const text = fs.readFileSync(full, 'utf8');
          if (/^\s*(int|void)\s+main\s*\(/m.test(text)) {
            out.push(path.relative(printfPath, full));
          }
        } catch { /* ignore unreadable */ }
      }
    }
  };
  walk(printfPath, 0);
  return out;
}

async function build(printfPath, libftPath) {
  const opts = {
    stdio: ['ignore', 'pipe', 'pipe'],
    streamStdout: false,
    streamStderr: false,
  };
  // Always fclean the student's project first — see libft tester for the
  // full reasoning (stale .o files compiled with different CFLAGS / against
  // an older header / without ASan can link silently and produce wrong
  // results).
  await spawnAsync('make', ['-C', printfPath, 'fclean'], opts);
  if (libftPath) {
    await spawnAsync('make', ['-C', libftPath, 'fclean'], opts);
  }
  await spawnAsync('make', ['-C', TESTER_DIR, 'clean'], opts);
  const implemented = detectImplemented(printfPath);
  const args = [
    '-C', TESTER_DIR,
    `LIBFT_PATH=${printfPath}`,
    `EXTRA_CFLAGS=${implemented ? '-DHAVE_FT_printf' : ''}`,
  ];
  if (libftPath) args.push(`LIBFT_LINK_PATH=${libftPath}`);
  args.push('build');
  return spawnAsync('make', args, opts);
}

async function runTester(printfPath, options) {
  if (!fs.existsSync(path.join(TESTER_DIR, 'tester.c'))) {
    return {
      exitCode: 1,
      stage: 'setup',
      error: `Bundled tester source not found at ${TESTER_DIR}`,
    };
  }

  const libftPath = options && options.libftPath;
  const buildLabel = libftPath
    ? '  building libftprintf + libft + tester…\n'
    : '  building libftprintf + tester…\n';
  process.stdout.write(c.dim(buildLabel));
  const built = await build(printfPath, libftPath);
  if (built.exitCode !== 0) {
    const log = (built.stderr || '') + (built.stdout || '');
    const dupMain = /duplicate symbol .*_main|multiple definition of .*main/i.test(log);
    return {
      exitCode: built.exitCode,
      stage: 'build',
      stdout: built.stdout,
      stderr: built.stderr,
      error: built.error,
      mainOffenders: dupMain ? findMainOffenders(printfPath) : [],
    };
  }

  process.stdout.write('\n');
  // ASan defaults differ between Linux (_exit on error) and macOS (abort()).
  // Pin them so the tester behaves the same everywhere, and silence leak
  // detection (we don't always free in the tests and don't want false noise).
  const asanOpts = [
    'abort_on_error=0',
    'halt_on_error=1',
    'detect_leaks=0',
    'print_stacktrace=1',
    'symbolize=1',
    'color=always',
  ].join(':');
  const run = await spawnAsync(TESTER_BIN, ['--color'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: TESTER_DIR,
    env: {
      ...process.env,
      ASAN_OPTIONS: asanOpts,
      UBSAN_OPTIONS: 'print_stacktrace=1',
    },
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
        `  ${c.yellow('why:')}   libftprintf.a must be a library only — the linker sees two main()s ` +
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
        ' make sure ft_printf is implemented and the Makefile produces libftprintf.a.'
    );
    return lines.join('\n');
  }
  // run stage — the C tester already printed its own pretty summary.
  // Surface ASan / UBSan trips so users don't wonder why the run stopped.
  const stderr = result.stderr || '';
  const asanMatch = stderr.match(/AddressSanitizer:\s*([\w-]+)[\s\S]*?in\s+(\S+)\s+(\S+:\d+)/);
  const ubsanMatch = stderr.match(/runtime error:\s*([^\n]+)/);
  if (asanMatch) {
    lines.push('');
    lines.push(`${c.bold('Result:')} ${c.red('FAIL — memory error')}`);
    lines.push(
      `  ${c.yellow('AddressSanitizer:')} ${c.bold(asanMatch[1])} in ` +
        `${c.bold(asanMatch[2])} (${asanMatch[3]})`
    );
    lines.push(
      `  ${c.dim('full stack trace and shadow map are above. fix this first — ' +
        'memory bugs can mask or fake later assertion results.')}`
    );
    return lines.join('\n');
  }
  if (ubsanMatch) {
    lines.push('');
    lines.push(`${c.bold('Result:')} ${c.red('FAIL — undefined behavior')}`);
    lines.push(`  ${c.yellow('UBSan:')} ${ubsanMatch[1]}`);
    return lines.join('\n');
  }
  return '';
}

module.exports = { runTester, summarize, TESTER_DIR, detectImplemented };
