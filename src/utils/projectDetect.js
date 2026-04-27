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

function resolveLibftPath(input) {
  if (!input) return null;
  const abs = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
  return abs;
}

module.exports = { isLibftDir, resolveLibftPath };
