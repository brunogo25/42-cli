'use strict';

const readline = require('readline');
const c = require('./colors');

// 1-9 first, then the top QWERTY row for menus with more than 9 items.
// '0' is reserved for the back action (assigned to any choice with value === 'back').
const HOTKEY_SEQ = ['1','2','3','4','5','6','7','8','9','q','w','e','r','t','y','u','i','o','p'];

// A choice is inert when it cannot be picked: `disabled` items are shown as
// unavailable, `header` items are group titles that only label what follows.
function inert(choice) {
  return Boolean(choice.disabled || choice.header);
}

function buildHotkeyMap(choices) {
  const keyByIdx = new Array(choices.length).fill(null);
  let cursor = 0;
  choices.forEach((ch, i) => {
    if (inert(ch)) return;
    if (ch.value === 'back') { keyByIdx[i] = '0'; return; }
    if (cursor < HOTKEY_SEQ.length) {
      keyByIdx[i] = HOTKEY_SEQ[cursor];
      cursor++;
    }
  });
  return keyByIdx;
}

function select({ message, choices, hint, shortcuts }) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    let index = choices.findIndex((ch) => !inert(ch));
    if (index < 0) index = 0;

    const hotkeyByIdx = buildHotkeyMap(choices);

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
        // group titles get no cursor column and no hotkey slot — just the name
        if (choice.header) {
          stdout.write(`  ${c.bold(c.gray(choice.label))}\x1b[K\n`);
          return;
        }
        const isSelected = i === index;
        const arrow = isSelected ? c.cyan('❯') : ' ';
        const hk = hotkeyByIdx[i];
        const keyTag = hk ? c.dim(`[${hk}]`) : '   ';
        let label = choice.label;
        if (choice.disabled) {
          const tag = choice.disabled === true ? 'disabled' : choice.disabled;
          label = `${c.gray(label)} ${c.yellow(`(${tag})`)}`;
        } else if (isSelected) {
          label = c.cyan(label);
        }
        stdout.write(`${arrow} ${keyTag} ${label}\x1b[K\n`);
      });
      if (hint) stdout.write(`${c.dim(hint)}\x1b[K\n`);
    }

    function moveSelection(step) {
      let next = index;
      for (let i = 0; i < choices.length; i++) {
        next = (next + step + choices.length) % choices.length;
        if (!inert(choices[next])) {
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
        if (inert(choices[index])) return;
        submitAt(index);
      } else if (shortcuts && str && Object.prototype.hasOwnProperty.call(shortcuts, str)) {
        const target = shortcuts[str];
        const idx = choices.findIndex((ch) => ch.value === target && !inert(ch));
        if (idx >= 0) submitAt(idx);
      } else if (str) {
        const k = str.toLowerCase();
        const idx = hotkeyByIdx.indexOf(k);
        if (idx >= 0 && !inert(choices[idx])) submitAt(idx);
      }
    }

    stdin.on('keypress', onKey);
    stdin.resume();
    render();
  });
}

module.exports = { select };
