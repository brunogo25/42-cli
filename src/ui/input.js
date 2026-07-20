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

// A prompt that stays open across many questions. input() spins up a fresh
// readline per call, which is fine for a one-off question but loses buffered
// input when asked in a loop — the exam simulator asks for a command after
// every submission, so it holds one interface open instead.
//
// ask() resolves to null when the stream ends (EOF / Ctrl-D), which callers
// should treat as "stop asking".
function createPrompt() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdin.isTTY),
  });

  // Lines are queued as they arrive rather than pulled one at a time with
  // rl.question(). A non-TTY stdin delivers every line at once and then closes,
  // which would strand anything past the first question; buffering here keeps
  // the loop working identically when driven by a pipe or by a person.
  const queue = [];
  const waiting = [];
  let ended = false;

  rl.on('line', (line) => {
    const next = waiting.shift();
    if (next) next(line.trim());
    else queue.push(line.trim());
  });
  rl.on('close', () => {
    ended = true;
    while (waiting.length) waiting.shift()(null);
  });

  return {
    ask(message) {
      const label = `${c.cyan('?')} ${c.bold(message)} `;
      if (queue.length) {
        const line = queue.shift();
        process.stdout.write(label + line + '\n');
        return Promise.resolve(line);
      }
      if (ended) return Promise.resolve(null);
      process.stdout.write(label);
      return new Promise((resolve) => waiting.push(resolve));
    },
    close() {
      if (!ended) rl.close();
    },
  };
}

module.exports = { input, createPrompt };
