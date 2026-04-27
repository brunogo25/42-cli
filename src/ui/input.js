'use strict';

const readline = require('readline');
const c = require('./colors');

function input({ message, defaultValue }) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const suffix = defaultValue ? c.dim(` (${defaultValue})`) : '';
    rl.question(`${c.cyan('?')} ${c.bold(message)}${suffix} `, (answer) => {
      rl.close();
      const value = answer.trim() || defaultValue || '';
      resolve(value);
    });
  });
}

module.exports = { input };
