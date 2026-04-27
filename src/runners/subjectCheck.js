'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const c = require('../ui/colors');
const { FUNCTIONS } = require('./libftTester');

const REQUIRED_MAKE_RULES = ['$(NAME)', 'all', 'clean', 'fclean', 're'];

function checkRequiredFiles(libftPath) {
  const missing = [];
  if (!fs.existsSync(path.join(libftPath, 'Makefile'))) missing.push('Makefile');
  if (!fs.existsSync(path.join(libftPath, 'libft.h'))) missing.push('libft.h');
  for (const fn of FUNCTIONS) {
    const file = `ft_${fn}.c`;
    if (!fs.existsSync(path.join(libftPath, file))) missing.push(file);
  }
  return {
    name: 'Required files (Makefile, libft.h, all 42 ft_*.c)',
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `${FUNCTIONS.length + 2} files present`
      : `missing: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? ` (+${missing.length - 5} more)` : ''}`,
  };
}

function checkMakefileRules(libftPath) {
  const mk = path.join(libftPath, 'Makefile');
  if (!fs.existsSync(mk)) {
    return { name: 'Makefile rules', pass: false, detail: 'Makefile not found' };
  }
  const text = fs.readFileSync(mk, 'utf8');
  const missing = [];
  for (const rule of REQUIRED_MAKE_RULES) {
    const escaped = rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${escaped}\\s*:`, 'm');
    if (!re.test(text)) missing.push(rule);
  }
  return {
    name: 'Makefile rules ($(NAME), all, clean, fclean, re)',
    pass: missing.length === 0,
    detail: missing.length === 0 ? 'all 5 rules present' : `missing: ${missing.join(', ')}`,
  };
}

function checkLibftHeader(libftPath) {
  const hdr = path.join(libftPath, 'libft.h');
  if (!fs.existsSync(hdr)) {
    return { name: 'libft.h structure', pass: false, detail: 'libft.h not found' };
  }
  const text = fs.readFileSync(hdr, 'utf8');
  const issues = [];
  if (!/typedef\s+struct\s+s_list\s*\{[\s\S]*?\}\s*t_list\s*;/.test(text)) {
    issues.push('t_list struct missing or wrong shape');
  }
  if (!/^#\s*ifndef\s+\w+/m.test(text) || !/^#\s*define\s+\w+/m.test(text)) {
    issues.push('include guard missing');
  }
  // every ft_* prototype should be declared
  const undeclared = [];
  for (const fn of FUNCTIONS) {
    if (!new RegExp(`\\bft_${fn}\\s*\\(`).test(text)) undeclared.push(`ft_${fn}`);
  }
  if (undeclared.length > 0) {
    issues.push(
      `${undeclared.length} prototype(s) missing (e.g. ${undeclared.slice(0, 3).join(', ')})`
    );
  }
  return {
    name: 'libft.h structure (guard + t_list + 42 prototypes)',
    pass: issues.length === 0,
    detail: issues.length === 0 ? 'header looks good' : issues.join('; '),
  };
}

function spawnSilent(cmd, args, opts) {
  return new Promise((resolve) => {
    let stdout = '', stderr = '';
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', (err) => resolve({ exitCode: 1, stdout, stderr, err }));
    child.on('close', (code) => resolve({ exitCode: code, stdout, stderr }));
  });
}

async function checkNoRelink(libftPath) {
  if (!fs.existsSync(path.join(libftPath, 'Makefile'))) {
    return { name: 'Makefile does not relink', pass: false, detail: 'no Makefile' };
  }
  const first = await spawnSilent('make', ['-C', libftPath]);
  if (first.exitCode !== 0) {
    return {
      name: 'Makefile does not relink',
      pass: false,
      detail: `initial build failed (exit ${first.exitCode})`,
    };
  }
  const second = await spawnSilent('make', ['-C', libftPath]);
  // BSD make and GNU make both print "Nothing to be done" or "is up to date"
  // when there's nothing to rebuild. If the second run rebuilt anything, we
  // catch it via the presence of cc/ar invocations in the output.
  const rebuilt = /\b(cc|clang|gcc|ar)\b/.test(second.stdout);
  return {
    name: 'Makefile does not relink',
    pass: !rebuilt,
    detail: rebuilt ? 'second `make` rebuilt sources — Makefile relinks' : 'no relink on second invocation',
  };
}

function stripCComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function checkNoMainInSources(libftPath) {
  const offenders = [];
  for (const fn of FUNCTIONS) {
    const file = path.join(libftPath, `ft_${fn}.c`);
    if (!fs.existsSync(file)) continue;
    const text = stripCComments(fs.readFileSync(file, 'utf8'));
    if (/^\s*(int|void)\s+main\s*\(/m.test(text)) {
      offenders.push(`ft_${fn}.c`);
    }
  }
  return {
    name: 'No main() in source files (libft.a must be library-only)',
    pass: offenders.length === 0,
    detail: offenders.length === 0
      ? 'no stray main() functions'
      : `found in: ${offenders.join(', ')}`,
  };
}

async function runCompliance(libftPath) {
  const checks = [];
  checks.push(checkRequiredFiles(libftPath));
  checks.push(checkMakefileRules(libftPath));
  checks.push(checkLibftHeader(libftPath));
  checks.push(checkNoMainInSources(libftPath));
  checks.push(await checkNoRelink(libftPath));
  return checks;
}

function summarize(checks) {
  const lines = [''];
  lines.push(c.bold('Subject compliance'));
  for (const ch of checks) {
    const mark = ch.pass ? c.green('✓') : c.red('✗');
    lines.push(`  ${mark} ${ch.name}`);
    if (ch.detail) {
      const colorize = ch.pass ? c.dim : c.yellow;
      lines.push(`     ${colorize(ch.detail)}`);
    }
  }
  const passed = checks.filter((ch) => ch.pass).length;
  const total = checks.length;
  const ok = passed === total;
  lines.push('');
  lines.push(
    `  ${c.bold('Result:')}    ${ok ? c.green('PASS') : c.red('FAIL')}  ` +
      `${c.dim(`(${passed}/${total} checks)`)}`
  );
  return lines.join('\n');
}

module.exports = { runCompliance, summarize };
