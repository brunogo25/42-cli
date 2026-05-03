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

// The gnl subject mandates the three files at the project root. No Makefile
// is required (the eval compiles the .c files directly), so we don't insist
// on one — students often submit without one.
function isGnlDir(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
  } catch {
    return false;
  }
  const required = ['get_next_line.c', 'get_next_line_utils.c', 'get_next_line.h'];
  for (const f of required) {
    if (!fs.existsSync(path.join(dir, f))) return false;
  }
  return true;
}

function resolveLibftPath(input) {
  if (!input) return null;
  const abs = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  return abs;
}

// Common convention: students keep their libft as a sibling subdirectory of
// the ft_printf project (e.g. ft_printf/libft/). Returns the absolute path
// when it looks like a libft, otherwise null.
function findBundledLibft(printfPath) {
  if (!printfPath) return null;
  const candidate = path.join(printfPath, 'libft');
  return isLibftDir(candidate) ? candidate : null;
}

module.exports = { isLibftDir, isFtPrintfDir, isGnlDir, resolveLibftPath, findBundledLibft };
