'use strict';

const c = require('./colors');

const ART = [
  '   _  _  ____   ',
  '  | || ||___ \\  ',
  '  | || |_ __) | ',
  '  |__   _/ __/  ',
  '     |_||_____| ',
];

const DESCRIPTION =
  '42 — an interactive CLI to test your 42 Common Core exercises.';
const CREDITS = 'by Bruno Gomez (bgomez) · 2026 piscine student';

function banner() {
  const art = ART.map((l) => c.cyan(l)).join('\n');
  return `\n${art}\n  ${c.bold(DESCRIPTION)}\n  ${c.dim(CREDITS)}\n\n`;
}

module.exports = { banner };
