'use strict';

const fs = require('fs');
const path = require('path');

// Files Python and the OS leave behind that must never be turned in.
const GARBAGE_DIRS = new Set(['__pycache__', '.mypy_cache', '.pytest_cache', '.ruff_cache']);
const GARBAGE_FILES = new Set(['.DS_Store']);
const GARBAGE_EXTS = new Set(['.pyc', '.pyo']);
// Never look inside these (git history, deps, virtualenvs).
const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'venv']);

// Returns the absolute paths of every garbage file/dir under `dir`.
// Symlinks are never followed (Dirent.isDirectory() is false for them).
function findGarbage(dir, found = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (GARBAGE_DIRS.has(entry.name)) found.push(full);
      else if (!SKIP_DIRS.has(entry.name)) findGarbage(full, found);
    } else if (GARBAGE_FILES.has(entry.name) || GARBAGE_EXTS.has(path.extname(entry.name))) {
      found.push(full);
    }
  }
  return found;
}

function removeGarbage(paths) {
  for (const p of paths) fs.rmSync(p, { recursive: true, force: true });
}

module.exports = { findGarbage, removeGarbage };
