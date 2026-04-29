'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const c = require('../ui/colors');

const REQUIRED_MAKE_RULES = ['$(NAME)', 'all', 'clean', 'fclean', 're'];

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

function stripCComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

// Walks the project tree (depth-bounded) collecting .c and .h files. Skips
// .git, hidden dirs, node_modules. The student's libft/ bundle IS included
// because the subject says norminette and submission rules apply to the whole
// repository — they'd be flagged for the same things by the moulinette.
function walkSources(root, depth = 0, acc = []) {
  if (depth > 4) return acc;
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walkSources(full, depth + 1, acc);
    } else if (/\.(c|h)$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function checkRequiredFiles(printfPath) {
  const missing = [];
  if (!fs.existsSync(path.join(printfPath, 'Makefile'))) missing.push('Makefile');
  if (!fs.existsSync(path.join(printfPath, 'ft_printf.h'))) missing.push('ft_printf.h');
  const sources = walkSources(printfPath).filter((f) => f.endsWith('.c'));
  if (sources.length === 0) missing.push('any .c source');
  return {
    name: 'Required files (Makefile, ft_printf.h, .c sources)',
    pass: missing.length === 0,
    detail: missing.length === 0
      ? `${sources.length} .c file(s) found`
      : `missing: ${missing.join(', ')}`,
  };
}

function checkMakefileRules(printfPath) {
  const mk = path.join(printfPath, 'Makefile');
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
  // Subject explicitly says NAME = libftprintf.a.
  const nameMatch = text.match(/^\s*NAME\s*[:?]?=\s*([^\s#]+)/m);
  let detailExtras = '';
  if (nameMatch && nameMatch[1] !== 'libftprintf.a') {
    detailExtras = ` (warning: NAME=${nameMatch[1]}, subject requires libftprintf.a)`;
  }
  return {
    name: 'Makefile rules ($(NAME), all, clean, fclean, re)',
    pass: missing.length === 0 && (!nameMatch || nameMatch[1] === 'libftprintf.a'),
    detail: missing.length === 0
      ? `all 5 rules present${detailExtras}`
      : `missing: ${missing.join(', ')}${detailExtras}`,
  };
}

function checkPrintfHeader(printfPath) {
  const hdr = path.join(printfPath, 'ft_printf.h');
  if (!fs.existsSync(hdr)) {
    return { name: 'ft_printf.h structure', pass: false, detail: 'ft_printf.h not found' };
  }
  const text = fs.readFileSync(hdr, 'utf8');
  const issues = [];
  if (!/^#\s*ifndef\s+\w+/m.test(text) || !/^#\s*define\s+\w+/m.test(text)) {
    issues.push('include guard missing');
  }
  if (!/\bft_printf\s*\(/.test(text)) {
    issues.push('ft_printf prototype not declared');
  }
  return {
    name: 'ft_printf.h structure (guard + prototype)',
    pass: issues.length === 0,
    detail: issues.length === 0 ? 'header looks good' : issues.join('; '),
  };
}

const ALLOWED_DOTFILES = new Set([
  '.git', '.gitignore', '.gitattributes', '.gitmodules', '.gitkeep',
  '.norminette', '.norminette.toml', '.clang-format',
]);

const ALLOWED_PLAIN_NAMES = new Set([
  'Makefile', 'Makefile.bonus', 'ft_printf.h',
  'author', 'auteur',
  'LICENSE', 'LICENSE.md', 'README', 'README.md',
]);

function classifyEntry(name, isDir) {
  if (isDir) {
    if (ALLOWED_DOTFILES.has(name)) return { kind: 'allowed' };
    if (/\.dSYM$/.test(name)) return { kind: 'garbage', tag: 'debug bundle' };
    // libft/ is allowed (subject says you can bundle libft sources).
    // Other directories (sources split into modules) are also fine — moulinette
    // accepts */*.c. Flag truly anomalous dirs only.
    if (name === 'node_modules' || name === '.cache') return { kind: 'garbage', tag: 'tooling cruft' };
    return { kind: 'allowed' };
  }
  if (ALLOWED_PLAIN_NAMES.has(name)) return { kind: 'allowed' };
  if (ALLOWED_DOTFILES.has(name)) return { kind: 'allowed' };
  if (/\.(c|h)$/.test(name)) return { kind: 'allowed' };
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
  if (/\.(cpp|hpp|cc|cxx)$/.test(name)) return { kind: 'garbage', tag: 'non-C source' };
  return { kind: 'garbage', tag: 'unexpected file' };
}

function checkNoGarbageFiles(printfPath) {
  let entries;
  try {
    entries = fs.readdirSync(printfPath, { withFileTypes: true });
  } catch {
    return {
      name: 'No stray / garbage files at submission root',
      pass: false,
      detail: 'project directory unreadable',
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

function checkNoBuildArtifacts(printfPath) {
  // Walk recursively — students sometimes leave .o files in subdirs.
  const all = walkSources(printfPath);
  // Add non-source artifacts at root
  let entries;
  try { entries = fs.readdirSync(printfPath); } catch { return { name: 'No build artifacts', pass: false, detail: 'unreadable' }; }
  const found = entries.filter((n) => /\.(o|a)$/.test(n));
  // Also look one level deep for .o files
  const subOFiles = [];
  try {
    for (const e of fs.readdirSync(printfPath, { withFileTypes: true })) {
      if (!e.isDirectory() || e.name.startsWith('.') || e.name === 'node_modules') continue;
      try {
        for (const f of fs.readdirSync(path.join(printfPath, e.name))) {
          if (/\.(o|a)$/.test(f)) subOFiles.push(`${e.name}/${f}`);
        }
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  const all2 = [...found, ...subOFiles];
  const shown = all2.slice(0, 5).join(', ');
  const more = all2.length > 5 ? ` (+${all2.length - 5} more)` : '';
  // unused; kept to mirror libft check shape
  void all;
  return {
    name: 'No build artifacts (.o / .a)',
    pass: all2.length === 0,
    detail: all2.length === 0
      ? 'no .o / .a files'
      : `${all2.length} build artifact(s): ${shown}${more} — run \`make fclean\` before submitting`,
  };
}

// Subject (page 7): the very first line must be italicized and read
//   "This activity has been created as part of the 42 curriculum by <login1>[, <login2>[, ...]]".
// Plus required sections: Description, Instructions, Resources.
function checkReadme(printfPath) {
  const candidates = ['README.md', 'README'];
  const readme = candidates
    .map((n) => path.join(printfPath, n))
    .find((p) => fs.existsSync(p));
  if (!readme) {
    return {
      name: 'README (italic intro + Description / Instructions / Resources)',
      pass: false,
      detail: 'README.md not found',
    };
  }
  const text = fs.readFileSync(readme, 'utf8');
  const lines = text.split('\n');
  // Find first non-blank, non-heading, non-image line.
  let i = 0;
  while (i < lines.length) {
    const tline = lines[i].trim();
    if (tline === '' || tline.startsWith('#') || tline.startsWith('![') || tline.startsWith('<')) { i++; continue; }
    break;
  }
  const issues = [];
  if (i >= lines.length) {
    issues.push('no body text');
  } else {
    const first = lines[i].trim();
    const ast = first.startsWith('*') && first.endsWith('*')
      && !first.startsWith('**') && !first.endsWith('**')
      && first.length >= 3;
    const und = first.startsWith('_') && first.endsWith('_')
      && !first.startsWith('__') && !first.endsWith('__')
      && first.length >= 3;
    if (!(ast || und)) issues.push('first line is not italic — wrap it in *…* or _…_');
    if (!/this activity has been created as part of the 42 curriculum by/i.test(first)) {
      issues.push('first line must say "This activity has been created as part of the 42 curriculum by <login>"');
    }
  }
  // Required headings — case-insensitive, allow #/##/### and bold/plain.
  const hasSection = (name) => {
    const re = new RegExp(`(^#+\\s*${name}\\b|^\\*\\*${name}\\*\\*|^${name}\\s*$)`, 'im');
    return re.test(text);
  };
  if (!hasSection('Description')) issues.push('missing "Description" section');
  if (!hasSection('Instructions')) issues.push('missing "Instructions" section');
  if (!hasSection('Resources')) issues.push('missing "Resources" section');
  return {
    name: 'README (italic intro + Description / Instructions / Resources)',
    pass: issues.length === 0,
    detail: issues.length === 0 ? 'README looks good' : issues.join('; '),
  };
}

function checkNoMainInSources(printfPath) {
  const offenders = [];
  for (const file of walkSources(printfPath)) {
    if (!file.endsWith('.c')) continue;
    let text;
    try { text = stripCComments(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (/^\s*(int|void)\s+main\s*\(/m.test(text)) {
      offenders.push(path.relative(printfPath, file));
    }
  }
  return {
    name: 'No main() in source files (libftprintf.a must be library-only)',
    pass: offenders.length === 0,
    detail: offenders.length === 0
      ? 'no stray main() functions'
      : `found in: ${offenders.join(', ')}`,
  };
}

function diagnoseRelinkCauses(mkText) {
  const hints = [];
  for (const m of mkText.matchAll(/^[ \t]*\.PHONY[ \t]*:[ \t]*(.+)$/gm)) {
    if (/\$\(NAME\)|\bNAME\b|libftprintf\.a/i.test(m[1])) {
      hints.push('$(NAME) (or libftprintf.a) is in .PHONY — that forces a rebuild every run; remove it');
      break;
    }
  }
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
  if (/^\s*FORCE\s*:/m.test(mkText) && /:.*\bFORCE\b/m.test(mkText)) {
    hints.push('a rule depends on `FORCE` — that is the canonical "always rebuild" pattern');
  }
  return hints;
}

async function checkNoRelink(printfPath) {
  if (!fs.existsSync(path.join(printfPath, 'Makefile'))) {
    return { name: 'Makefile does not relink', pass: false, detail: 'no Makefile' };
  }
  // Start from clean — a stale libftprintf.a would let `make -q` falsely PASS.
  await spawnSilent('make', ['-C', printfPath, 'fclean']);
  const first = await spawnSilent('make', ['-C', printfPath]);
  if (first.exitCode !== 0) {
    return {
      name: 'Makefile does not relink',
      pass: false,
      detail: `initial \`make\` failed (exit ${first.exitCode}) — fix the Makefile so it builds, then re-run`,
    };
  }
  const q = await spawnSilent('make', ['-C', printfPath, '-q']);
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
  const second = await spawnSilent('make', ['-C', printfPath]);
  const out = (second.stdout || '') + '\n' + (second.stderr || '');
  const recipeLine = out.split('\n').find((l) => /\b(cc|clang|gcc|ar)\b/i.test(l));
  const mkText = fs.readFileSync(path.join(printfPath, 'Makefile'), 'utf8');
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

async function runCompliance(printfPath) {
  const checks = [];
  checks.push(checkRequiredFiles(printfPath));
  checks.push(checkNoGarbageFiles(printfPath));
  checks.push(checkNoBuildArtifacts(printfPath));
  checks.push(checkMakefileRules(printfPath));
  checks.push(checkPrintfHeader(printfPath));
  checks.push(checkReadme(printfPath));
  checks.push(checkNoMainInSources(printfPath));
  checks.push(await checkNoRelink(printfPath));
  return checks;
}

function summarize(checks) {
  const lines = [''];
  lines.push(c.bold('Subject compliance · ft_printf'));
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
