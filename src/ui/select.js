'use strict';

const readline = require('readline');
const c = require('./colors');

function select({ message, choices, hint, shortcuts }) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    let index = choices.findIndex((ch) => !ch.disabled);
    if (index < 0) index = 0;

    readline.emitKeypressEvents(stdin);
    if (stdin.isTTY) stdin.setRawMode(true);

    const totalLines = choices.length + 1 + (hint ? 1 : 0);
    let firstRender = true;

    function render() {
      if (!firstRender) stdout.write(`\x1b[${totalLines}A`);
      firstRender = false;
      stdout.write('\x1b[?25l');

      stdout.write(`${c.cyan('?')} ${c.bold(message)}\x1b[K\n`);
      choices.forEach((choice, i) => {
        const isSelected = i === index;
        const prefix = isSelected ? c.cyan('❯ ') : '  ';
        let label = choice.label;
        if (choice.disabled) {
          const tag = choice.disabled === true ? 'disabled' : choice.disabled;
          label = `${c.gray(label)} ${c.yellow(`(${tag})`)}`;
        } else if (isSelected) {
          label = c.cyan(label);
        }
        stdout.write(`${prefix}${label}\x1b[K\n`);
      });
      if (hint) stdout.write(`${c.dim(hint)}\x1b[K\n`);
    }

    function moveSelection(step) {
      let next = index;
      for (let i = 0; i < choices.length; i++) {
        next = (next + step + choices.length) % choices.length;
        if (!choices[next].disabled) {
          index = next;
          return;
        }
      }
    }

    function cleanup() {
      stdout.write('\x1b[?25h');
      if (stdin.isTTY) stdin.setRawMode(false);
      stdin.removeListener('keypress', onKey);
      stdin.pause();
    }

    function submitAt(i) {
      cleanup();
      stdout.write(`\x1b[${totalLines}A`);
      stdout.write(
        `${c.green('✓')} ${c.bold(message)} ${c.cyan(choices[i].label)}\x1b[K\n`
      );
      for (let k = 1; k < totalLines; k++) stdout.write('\x1b[K\n');
      stdout.write(`\x1b[${totalLines - 1}A`);
      resolve(choices[i].value);
    }

    function onKey(str, key) {
      if (!key) return;
      if (key.ctrl && key.name === 'c') {
        cleanup();
        stdout.write('\n');
        process.exit(0);
      }
      if (key.name === 'up' || key.name === 'k') {
        moveSelection(-1);
        render();
      } else if (key.name === 'down' || key.name === 'j') {
        moveSelection(1);
        render();
      } else if (key.name === 'return') {
        if (choices[index].disabled) return;
        submitAt(index);
      } else if (shortcuts && str && Object.prototype.hasOwnProperty.call(shortcuts, str)) {
        const target = shortcuts[str];
        const idx = choices.findIndex((ch) => ch.value === target && !ch.disabled);
        if (idx >= 0) submitAt(idx);
      }
    }

    stdin.on('keypress', onKey);
    stdin.resume();
    render();
  });
}

module.exports = { select };
