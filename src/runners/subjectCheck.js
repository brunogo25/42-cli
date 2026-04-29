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

function diagnoseRelinkCauses(mkText) {
  const hints = [];
  // (a) $(NAME) / NAME / libft.a listed in .PHONY → forces rebuild every run.
  for (const m of mkText.matchAll(/^[ \t]*\.PHONY[ \t]*:[ \t]*(.+)$/gm)) {
    if (/\$\(NAME\)|\bNAME\b|libft\.a/i.test(m[1])) {
      hints.push('$(NAME) (or libft.a) is in .PHONY — that forces a rebuild every run; remove it');
      break;
    }
  }
  // (b) $(NAME) rule prerequisites: must list real .o files, not phony targets.
  const nameRule = mkText.match(/^[ \t]*\$\(NAME\)[ \t]*:[ \t]*(.*)$/m);
  if (nameRule) {
    const deps = nameRule[1];
    if (!/\$\([A-Za-z_]*OBJ[A-Za-z_]*\)|\.o\b/.test(deps)) {
      hints.push('$(NAME) rule lists no object files (e.g. $(OBJS)) as prerequisites — link retriggers each run');
    }
    if (/\b(all|clean|fclean|re)\b/.test(deps)) {
      hints.push('$(NAME) depends on a phony target (all/clean/fclean/re) — those are always considered out-of-date');
    }
  } else {
    hints.push('no `$(NAME):` rule found — Makefile structure is unusual');
  }
  // (c) classic FORCE trick.
  if (/^\s*FORCE\s*:/m.test(mkText) && /:.*\bFORCE\b/m.test(mkText)) {
    hints.push('a rule depends on `FORCE` — that is the canonical "always rebuild" pattern');
  }
  return hints;
}

async function checkNoRelink(libftPath) {
  if (!fs.existsSync(path.join(libftPath, 'Makefile'))) {
    return { name: 'Makefile does not relink', pass: false, detail: 'no Makefile' };
  }
  // Start from a clean slate. Without this, a stale libft.a left over from a
  // prior build would make the first `make` a no-op and `make -q` would
  // wrongly report up-to-date — a false PASS that the moulinette would catch
  // first. (Best-effort: ignore fclean exit code; if fclean is broken, the
  // separate Makefile-rules check has already flagged it.)
  await spawnSilent('make', ['-C', libftPath, 'fclean']);
  const first = await spawnSilent('make', ['-C', libftPath]);
  if (first.exitCode !== 0) {
    return {
      name: 'Makefile does not relink',
      pass: false,
      detail: `initial \`make\` failed (exit ${first.exitCode}) — fix the Makefile so it builds, then re-run`,
    };
  }
  // make -q is the canonical "is anything out-of-date?" query. It walks the
  // exact same dependency graph make uses, without running any recipe — so
  // unrelated stdout chatter (echo lines mentioning cc/gcc, etc.) cannot
  // false-positive us the way the old recipe-line heuristic did.
  // Exit codes: 0 = up-to-date, 1 = would rebuild, 2 = make error.
  const q = await spawnSilent('make', ['-C', libftPath, '-q']);
  if (q.exitCode === 0) {
    return { name: 'Makefile does not relink', pass: true, detail: 'second `make` is a no-op' };
  }
  if (q.exitCode === 2) {
    const err = ((q.stderr || '') + (q.stdout || '')).trim().split('\n').slice(-3).join(' | ');
    return {
      name: 'Makefile does not relink',
      pass: false,
      detail: `\`make -q\` errored (exit 2) — Makefile is malformed: ${err.slice(0, 160)}`,
    };
  }
  // exit 1 → genuinely out-of-date. Capture the offending recipe line + introspect.
  const second = await spawnSilent('make', ['-C', libftPath]);
  const out = (second.stdout || '') + '\n' + (second.stderr || '');
  const recipeLine = out.split('\n').find((l) => /\b(cc|clang|gcc|ar)\b/i.test(l));
  const mkText = fs.readFileSync(path.join(libftPath, 'Makefile'), 'utf8');
  const hints = diagnoseRelinkCauses(mkText);

  let detail = 'second `make` is not a no-op (`make -q` reports out-of-date) — moulinette will reject this.';
  if (recipeLine) detail += ` Saw: «${recipeLine.trim().slice(0, 100)}».`;
  if (hints.length > 0) {
    detail += ' Likely cause: ' + hints.join(' / ') + '.';
  } else {
    detail += ' Common fixes: $(NAME) must depend on $(OBJS); never list $(NAME)/all in .PHONY; never depend on phony targets.';
  }
  return { name: 'Makefile does not relink', pass: false, detail };
}

function stripCComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

const ALLOWED_DOTFILES = new Set([
  '.git', '.gitignore', '.gitattributes', '.gitmodules', '.gitkeep',
  '.norminette', '.norminette.toml', '.clang-format',
]);

const ALLOWED_PLAIN_NAMES = new Set([
  'Makefile', 'Makefile.bonus', 'libft.h',
  'author', 'auteur',
  'LICENSE', 'LICENSE.md', 'README', 'README.md',
]);

function classifyEntry(name, isDir) {
  if (isDir) {
    if (ALLOWED_DOTFILES.has(name)) return { kind: 'allowed' };
    if (/\.dSYM$/.test(name)) return { kind: 'garbage', tag: 'debug bundle' };
    return { kind: 'garbage', tag: 'extra directory' };
  }
  if (ALLOWED_PLAIN_NAMES.has(name)) return { kind: 'allowed' };
  if (ALLOWED_DOTFILES.has(name)) return { kind: 'allowed' };
  const m = /^ft_(\w+)\.c$/.exec(name);
  if (m) {
    if (FUNCTIONS.includes(m[1])) return { kind: 'allowed' };
    return { kind: 'garbage', tag: 'unexpected ft_*.c' };
  }
  if (/\.(o|a)$/.test(name)) return { kind: 'artifact' };
  if (name === 'a.out' || /^a\.out\.\w+$/.test(name)) return { kind: 'garbage', tag: 'test binary' };
  if (name === 'core' || /^core\.\d+$/.test(name) || /^vgcore\.\d+$/.test(name)) {
    return { kind: 'garbage', tag: 'core dump' };
  }
  if (name === '.DS_Store' || name === 'Thumbs.db' || name === 'desktop.ini') {
    return { kind: 'garbage', tag: 'OS metadata' };
  }
  if (/\.(swp|swo)$/.test(name) || /~$/.test(name)) {
    return { kind: 'garbage', tag: 'editor backup' };
  }
  if (/\.(c|h)$/.test(name)) return { kind: 'garbage', tag: 'stray source' };
  if (/\.(cpp|hpp|cc|cxx)$/.test(name)) return { kind: 'garbage', tag: 'non-C source' };
  return { kind: 'garbage', tag: 'unexpected file' };
}

function checkNoGarbageFiles(libftPath) {
  let entries;
  try {
    entries = fs.readdirSync(libftPath, { withFileTypes: true });
  } catch {
    return {
      name: 'No stray / garbage files at submission root',
      pass: false,
      detail: 'libft directory unreadable',
    };
  }
  const garbage = [];
  for (const e of entries) {
    const verdict = classifyEntry(e.name, e.isDirectory());
    if (verdict.kind === 'garbage') {
      garbage.push(`${e.name}${e.isDirectory() ? '/' : ''} (${verdict.tag})`);
    }
  }
  const shown = garbage.slice(0, 5).join(', ');
  const more = garbage.length > 5 ? ` (+${garbage.length - 5} more)` : '';
  return {
    name: 'No stray / garbage files at submission root',
    pass: garbage.length === 0,
    detail: garbage.length === 0
      ? 'submission root is clean'
      : `${garbage.length} unwanted: ${shown}${more}`,
  };
}

function checkNoBuildArtifacts(libftPath) {
  let entries;
  try {
    entries = fs.readdirSync(libftPath);
  } catch {
    return {
      name: 'No build artifacts at submission root (.o / .a)',
      pass: false,
      detail: 'libft directory unreadable',
    };
  }
  const found = entries.filter((n) => /\.(o|a)$/.test(n));
  const shown = found.slice(0, 5).join(', ');
  const more = found.length > 5 ? ` (+${found.length - 5} more)` : '';
  return {
    name: 'No build artifacts at submission root (.o / .a)',
    pass: found.length === 0,
    detail: found.length === 0
      ? 'no .o / .a files'
      : `${found.length} build artifact(s): ${shown}${more} — run \`make fclean\` before submitting`,
  };
}

function checkReadmeIntroItalic(libftPath) {
  const candidates = ['README.md', 'README'];
  const readme = candidates
    .map((n) => path.join(libftPath, n))
    .find((p) => fs.existsSync(p));
  if (!readme) {
    return {
      name: 'README presents the student in italic',
      pass: false,
      detail: 'README not found — the student presentation paragraph must be in italic',
    };
  }
  const lines = fs.readFileSync(readme, 'utf8').split('\n');
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === '' || t.startsWith('#') || t.startsWith('![') || t.startsWith('<')) { i++; continue; }
    break;
  }
  if (i >= lines.length) {
    return {
      name: 'README presents the student in italic',
      pass: false,
      detail: 'README has no body text — first paragraph must introduce the student in italic',
    };
  }
  let para = '';
  while (i < lines.length && lines[i].trim() !== '') {
    para += (para ? ' ' : '') + lines[i].trim();
    i++;
  }
  const ast = para.startsWith('*') && para.endsWith('*')
    && !para.startsWith('**') && !para.endsWith('**')
    && para.length >= 3;
  const und = para.startsWith('_') && para.endsWith('_')
    && !para.startsWith('__') && !para.endsWith('__')
    && para.length >= 3;
  const isItalic = ast || und;
  const preview = para.length > 60 ? para.slice(0, 60) + '…' : para;
  return {
    name: 'README presents the student in italic',
    pass: isItalic,
    detail: isItalic
      ? 'first paragraph is italicized'
      : `first paragraph is not italic — wrap it in *…* or _…_  («${preview}»)`,
  };
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
  checks.push(checkNoGarbageFiles(libftPath));
  checks.push(checkNoBuildArtifacts(libftPath));
  checks.push(checkMakefileRules(libftPath));
  checks.push(checkLibftHeader(libftPath));
  checks.push(checkReadmeIntroItalic(libftPath));
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
