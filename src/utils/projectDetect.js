'use strict';

const fs = require('fs');
const path = require('path');

function isLibftDir(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
  } catch {
    return false;
  }
  const required = ['Makefile', 'libft.h'];
  for (const f of required) {
    if (!fs.existsSync(path.join(dir, f))) return false;
  }
  const entries = fs.readdirSync(dir);
  return entries.some((f) => /^ft_.*\.c$/.test(f));
}

function isFtPrintfDir(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
  } catch {
    return false;
  }
  // Subject is permissive about source layout (*.c, */*.c) so we don't insist
  // on ft_printf.c specifically — just the Makefile and the header.
  if (!fs.existsSync(path.join(dir, 'Makefile'))) return false;
  if (!fs.existsSync(path.join(dir, 'ft_printf.h'))) return false;
  return true;
}

function resolveLibftPath(input) {
  if (!input) return null;
  const abs = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  return abs;
}

module.exports = { isLibftDir, isFtPrintfDir, resolveLibftPath };
