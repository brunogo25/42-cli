'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const c = require('../ui/colors');

const TESTER_DIR = path.join(__dirname, '..', '..', 'resources', 'gnl-tester');
const TESTER_BIN = path.join(TESTER_DIR, '42_gnl_tester');

// The subject teases this directly: "Does your function still work if the
// BUFFER_SIZE value is 9999? If it is 1? 10000000?". 1 forces every byte to
// be a separate read, 9999 dwarfs every fixture line, 42 is the canonical
// "ordinary" case. We skip 10_000_000 because the boundary fixture allocates
// O(BUFFER_SIZE) bytes — a 10 MB stack frame would crash the tester process
// on macOS without giving us any new information.
const DEFAULT_BUFFER_SIZES = [1, 42, 9999];

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

// Heuristic: does the project actually expose a get_next_line() function?
// If not we still try the build (the make checkpath catches missing files
// up front), but a missing prototype is a friendlier early signal than a
// linker error full of mangled mess.
function detectImplemented(gnlPath) {
  try {
    const header = fs
      .readFileSync(path.join(gnlPath, 'get_next_line.h'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    return /\bget_next_line\s*\(/.test(header);
  } catch {
    return false;
  }
}

// Walk the project for any .c at the root with a main() — same diagnostic
// shape as the libft / ft_printf testers. The subject doesn't ship a .a so
// the duplicate-main symptom is "tester won't link"; the cause is always the
// same: a stray main() in their tree.
function findMainOffenders(gnlPath) {
  const out = [];
  let entries;
  try { entries = fs.readdirSync(gnlPath); } catch { return out; }
  for (const f of entries) {
    if (!/\.c$/.test(f)) continue;
    let text;
    try { text = fs.readFileSync(path.join(gnlPath, f), 'utf8'); } catch { continue; }
    if (/^\s*(int|void)\s+main\s*\(/m.test(text)) out.push(f);
  }
  return out;
}

async function build(gnlPath, bufferSize) {
  const opts = {
    stdio: ['ignore', 'pipe', 'pipe'],
    streamStdout: false,
    streamStderr: false,
  };
  // Always clean the tester dir between runs — same BUFFER_SIZE may appear
  // back-to-back, but we also iterate over multiple sizes so a stale .o from
  // the previous size would give wrong results silently.
  await spawnAsync('make', ['-C', TESTER_DIR, 'clean'], opts);
  const args = [
    '-C', TESTER_DIR,
    `GNL_PATH=${gnlPath}`,
    `BUFFER_SIZE=${bufferSize}`,
    'build',
  ];
  return spawnAsync('make', args, opts);
}

async function runOne(gnlPath, bufferSize) {
  if (!fs.existsSync(path.join(TESTER_DIR, 'tester.c'))) {
    return {
      bufferSize,
      exitCode: 1,
      stage: 'setup',
      error: `Bundled tester source not found at ${TESTER_DIR}`,
    };
  }

  process.stdout.write(c.dim(`  building gnl + tester (BUFFER_SIZE=${bufferSize})…\n`));
  const built = await build(gnlPath, bufferSize);
  if (built.exitCode !== 0) {
    const log = (built.stderr || '') + (built.stdout || '');
    const dupMain = /duplicate symbol .*_main|multiple definition of .*main/i.test(log);
    return {
      bufferSize,
      exitCode: built.exitCode,
      stage: 'build',
      stdout: built.stdout,
      stderr: built.stderr,
      error: built.error,
      mainOffenders: dupMain ? findMainOffenders(gnlPath) : [],
    };
  }

  process.stdout.write('\n');
  // ASan defaults differ between Linux (_exit on error) and macOS (abort()).
  // Pin them so the tester behaves the same everywhere, and silence leak
  // detection (gnl is ALLOWED to leave its static buffer allocated when
  // EOF is signalled with NULL — that's not a leak, but ASan's default
  // policy would flag it).
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
    bufferSize,
    exitCode: run.exitCode,
    stage: 'run',
    stdout: run.stdout,
    stderr: run.stderr,
    error: run.error,
  };
}

async function runTester(gnlPath, options) {
  if (!detectImplemented(gnlPath)) {
    return {
      exitCode: 1,
      stage: 'setup',
      error:
        `get_next_line() prototype not found in ${path.join(gnlPath, 'get_next_line.h')} — declare \`char *get_next_line(int fd);\` and try again.`,
      runs: [],
    };
  }

  const sizes = (options && Array.isArray(options.bufferSizes) && options.bufferSizes.length)
    ? options.bufferSizes
    : DEFAULT_BUFFER_SIZES;

  const runs = [];
  for (let i = 0; i < sizes.length; i++) {
    const bs = sizes[i];
    if (i > 0) {
      console.log('');
      console.log(c.dim('  ' + '─'.repeat(40)));
      console.log('');
    }
    console.log(c.bold(`  ▸ BUFFER_SIZE = ${bs}`));
    console.log('');
    const r = await runOne(gnlPath, bs);
    runs.push(r);
    // Stop the cascade on a build failure: rebuilding with another
    // BUFFER_SIZE won't fix a missing source file or a syntax error in the
    // student's gnl. Better to surface one clear error than three identical
    // ones in a row.
    if (r.stage === 'build' || r.stage === 'setup') break;
  }

  // Aggregate exit code: any non-zero run = overall failure.
  const failed = runs.find((r) => r.exitCode !== 0);
  return {
    exitCode: failed ? failed.exitCode : 0,
    stage: failed ? failed.stage : 'run',
    runs,
    // Surface the first failure's diagnostics at the top level for
    // summarize() to inspect without having to know about runs[].
    stdout: failed ? failed.stdout : '',
    stderr: failed ? failed.stderr : '',
    error: failed ? failed.error : undefined,
    mainOffenders: failed ? failed.mainOffenders : undefined,
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
        `  ${c.yellow('why:')}   the tester compiles your get_next_line.c + tester.c into one binary — ` +
          'two main() definitions and the linker refuses.'
      );
      lines.push(
        `  ${c.dim('move test main()s into a separate file outside the project root.')}`
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
        ' make sure get_next_line.c, get_next_line_utils.c and get_next_line.h all live at the project root.'
    );
    return lines.join('\n');
  }

  // Per-BUFFER_SIZE recap so the user sees at a glance which sizes broke
  // without scrolling back through the C tester output.
  const ran = (result.runs || []).filter((r) => r.stage === 'run');
  if (ran.length > 1) {
    lines.push('');
    lines.push(c.bold('  Per-BUFFER_SIZE recap:'));
    for (const r of ran) {
      const ok = r.exitCode === 0;
      const tag = ok ? c.green('PASS') : c.red('FAIL');
      lines.push(`    ${tag}  BUFFER_SIZE=${r.bufferSize}`);
    }
  }

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
  return lines.join('\n');
}

module.exports = {
  runTester,
  summarize,
  detectImplemented,
  TESTER_DIR,
  DEFAULT_BUFFER_SIZES,
};
