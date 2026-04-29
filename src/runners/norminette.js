'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const c = require('../ui/colors');

function collectSources(libftPath) {
  const entries = fs.readdirSync(libftPath);
  return entries
    .filter((f) => /^ft_.*\.c$/.test(f) || f === 'libft.h')
    .map((f) => path.join(libftPath, f))
    .sort();
}

function runNorminette(libftPath) {
  return new Promise((resolve) => {
    const files = collectSources(libftPath);
    if (files.length === 0) {
      return resolve({
        exitCode: 1,
        error: 'No ft_*.c or libft.h files found',
        files: [],
        errors: [],
      });
    }
    let buffer = '';
    let child;
    try {
      child = spawn('norminette', files, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      return resolve({
        exitCode: 1,
        error: err.message,
        files,
        errors: [],
      });
    }
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      buffer += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on('error', (err) => {
      const notInstalled = err.code === 'ENOENT';
      resolve({
        exitCode: 127,
        error: notInstalled
          ? 'norminette is not installed (try `pip install norminette`)'
          : err.message,
        files,
        errors: [],
      });
    });
    child.on('close', (code) => {
      const errFiles = (buffer.match(/^.+:\s+Error/gm) || []).map((l) =>
        l.replace(/:\s+Error.*/, '')
      );
      resolve({ exitCode: code, files, errors: errFiles });
    });
  });
}

function summarize(result) {
  const passed = result.exitCode === 0;
  const header = passed ? c.green('PASS') : c.red('FAIL');
  const lines = [''];
  lines.push(`${c.bold('Norminette:')} ${header}`);
  lines.push(`  ${c.dim(`${result.files.length} files checked`)}`);
  if (result.errors && result.errors.length > 0) {
    lines.push(
      `  ${c.yellow(`${result.errors.length} file(s) with style errors`)} ` +
        c.dim('— see the per-file output above for details')
    );
  }
  if (result.error) {
    lines.push(`  ${c.red('error:')} ${result.error}`);
    if (/not installed/i.test(result.error)) {
      lines.push(`  ${c.yellow('hint:')} install with ${c.bold('pip install norminette')}.`);
    }
  }
  return lines.join('\n');
}

// Recursive variant for projects that have sources in subdirectories
// (e.g. ft_printf with a libft/ bundle, or split modules under utils/).
// Norminette accepts a directory and walks it; we just hand it the root.
function runNorminetteRecursive(projectPath) {
  return new Promise((resolve) => {
    let buffer = '';
    let child;
    try {
      child = spawn('norminette', [projectPath], { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      return resolve({ exitCode: 1, error: err.message, files: [], errors: [] });
    }
    child.stdout.on('data', (chunk) => { buffer += chunk.toString(); process.stdout.write(chunk); });
    child.stderr.on('data', (chunk) => { buffer += chunk.toString(); process.stderr.write(chunk); });
    child.on('error', (err) => {
      const notInstalled = err.code === 'ENOENT';
      resolve({
        exitCode: 127,
        error: notInstalled
          ? 'norminette is not installed (try `pip install norminette`)'
          : err.message,
        files: [],
        errors: [],
      });
    });
    child.on('close', (code) => {
      const errFiles = (buffer.match(/^.+:\s+Error/gm) || []).map((l) => l.replace(/:\s+Error.*/, ''));
      const okFiles = (buffer.match(/^.+:\s+OK/gm) || []).map((l) => l.replace(/:\s+OK.*/, ''));
      resolve({ exitCode: code, files: [...okFiles, ...errFiles], errors: errFiles });
    });
  });
}

module.exports = { runNorminette, runNorminetteRecursive, summarize };
