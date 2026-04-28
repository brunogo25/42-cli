'use strict';

const c = require('./colors');
const { t, getLanguage } = require('../i18n');

const FRAME_MS = 180;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isAnimatable() {
  return Boolean(process.stdout.isTTY);
}

function clearLines(n) {
  for (let i = 0; i < n; i++) {
    process.stdout.write('\x1b[1A\x1b[2K');
  }
}

function printFrame(lines) {
  for (const l of lines) process.stdout.write(`${l}\n`);
}

const RAINBOW = [c.red, c.yellow, c.green, c.cyan, c.blue, c.magenta];
function rainbow(text) {
  let out = '';
  let i = 0;
  for (const ch of text) {
    out += ch === ' ' ? ch : RAINBOW[i++ % RAINBOW.length](ch);
  }
  return out;
}

async function dancingCat() {
  const banner = `  ${c.magenta(c.bold('★ '))}${rainbow(t('fun.luckyDay'))}${c.magenta(c.bold(' ★'))}`;
  const frames = [
    ['  /\\_/\\  ', ' ( o.o ) ', '  > ^ <  '],
    ['  /\\_/\\  ', ' ( ^.^ ) ', ' />^ <   '],
    ['  /\\_/\\  ', ' ( -_- ) ', '   > ^ <\\'],
    ['  /\\_/\\  ', ' ( ^o^ ) ', ' />^ <\\  '],
  ];

  if (!isAnimatable()) {
    console.log(banner);
    console.log(`  ${c.cyan(frames[3][0])}`);
    console.log(`  ${c.cyan(frames[3][1])}`);
    console.log(`  ${c.cyan(frames[3][2])}\n`);
    return;
  }

  console.log(banner);
  // reserve 3 lines once, then redraw
  let drawn = false;
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const f of frames) {
      if (drawn) clearLines(3);
      console.log(`  ${c.cyan(f[0])}`);
      console.log(`  ${c.cyan(f[1])}`);
      console.log(`  ${c.cyan(f[2])}`);
      drawn = true;
      await sleep(FRAME_MS);
    }
  }
  console.log();
}

async function fireworks() {
  const banner = `  ${c.yellow(c.bold('✨ '))}${rainbow(t('fun.wow'))}${c.yellow(c.bold(' ✨'))}`;
  const frames = [
    ['     .     ', '     .     ', '     .     '],
    ['     *     ', '   . * .   ', '     *     '],
    ['  *  *  *  ', '   *   *   ', '  *  *  *  '],
    [' \\ | * | / ', '  *  *  *  ', ' / | * | \\ '],
    ['     .     ', '   .   .   ', '           '],
  ];

  if (!isAnimatable()) {
    console.log(banner);
    console.log(`  ${c.yellow(frames[3][0])}`);
    console.log(`  ${c.yellow(frames[3][1])}`);
    console.log(`  ${c.yellow(frames[3][2])}\n`);
    return;
  }

  console.log(banner);
  let drawn = false;
  for (const f of frames) {
    if (drawn) clearLines(3);
    console.log(`  ${c.yellow(f[0])}`);
    console.log(`  ${c.yellow(f[1])}`);
    console.log(`  ${c.yellow(f[2])}`);
    drawn = true;
    await sleep(220);
  }
  console.log();
}

async function discoBanner() {
  const text = t('fun.luckyDay');
  if (!isAnimatable()) {
    console.log(`  ${rainbow('*** ' + text + ' ***')}\n`);
    return;
  }
  let drawn = false;
  for (let i = 0; i < 6; i++) {
    if (drawn) clearLines(1);
    const stars = i % 2 === 0 ? '*** ' : ' ~ ~ ';
    console.log(`  ${rainbow(stars + text + stars.split('').reverse().join(''))}`);
    drawn = true;
    await sleep(150);
  }
  console.log();
}

async function play042Animation() {
  const tty = isAnimatable();

  const star = (s) => c.yellow(s);
  const wave = ['     ·     ', '    · ·    ', '   · ✦ ·   ', '  ·✦ ✦ ✦·  ', ' ✦ ° ✦ ° ✦ ', '✦ ° · ✦ · ° ✦'];
  const banner = [
    '╔═══════════════════════════════════╗',
    '║                                   ║',
    '║           0 . 4 2   %             ║',
    '║                                   ║',
    '║      THE  UNIVERSE  BLINKED       ║',
    '║                                   ║',
    '╚═══════════════════════════════════╝',
  ];
  const bannerFr = [
    '╔═══════════════════════════════════╗',
    '║                                   ║',
    '║           0 , 4 2   %             ║',
    '║                                   ║',
    '║   L\'UNIVERS  A  CLIGNÉ  DE  L\'ŒIL ║',
    '║                                   ║',
    '╚═══════════════════════════════════╝',
  ];

  if (!tty) {
    for (const line of banner) console.log(`  ${c.magenta(c.bold(line))}`);
    console.log();
    return;
  }

  // 1) Build-up: ripple of dots
  let drawn = false;
  for (const w of wave) {
    if (drawn) clearLines(1);
    process.stdout.write(`  ${star(w.padStart(36))}\n`);
    drawn = true;
    await sleep(140);
  }
  if (drawn) clearLines(1);

  // 2) Triple flash of expanding starfield
  const starFrames = [
    [
      '       .                  .       ',
      '   .          .       .           ',
      '         ✦         .              ',
      '   .         ✦  ✦  ✦         .    ',
      '          ✦   .   ✦               ',
      '   .         ✦  ✦  ✦         .    ',
      '         ✦         .              ',
      '   .          .       .           ',
      '       .                  .       ',
    ],
    [
      '  .    ✦      .   ✦      .   ✦    ',
      '     .    ✦       .       ✦   .   ',
      '  ✦         ✦    .    ✦           ',
      '     .   ✦   ✦   ✦   ✦   ✦    .   ',
      '   ✦   ✦   .  ⋆  .   ✦   ✦        ',
      '     .   ✦   ✦   ✦   ✦   ✦    .   ',
      '  ✦         ✦    .    ✦           ',
      '     .    ✦       .       ✦   .   ',
      '  .    ✦      .   ✦      .   ✦    ',
    ],
  ];
  for (const frame of starFrames) {
    for (const line of frame) console.log(`  ${star(line)}`);
    await sleep(180);
    clearLines(frame.length);
  }

  // 3) Rainbow rolling banner — 3 color rotations
  const rainbow = [c.red, c.yellow, c.green, c.cyan, c.blue, c.magenta];
  for (let pass = 0; pass < 3; pass++) {
    if (pass > 0) clearLines(banner.length);
    for (let i = 0; i < banner.length; i++) {
      const color = rainbow[(i + pass) % rainbow.length];
      console.log(`  ${color(c.bold((getLanguage() === 'fr' ? bannerFr : banner)[i]))}`);
    }
    await sleep(260);
  }
  console.log();
}

const ANIMATIONS = [dancingCat, fireworks, discoBanner];

async function playRandomAnimation() {
  const fn = ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
  await fn();
}

module.exports = { playRandomAnimation, play042Animation, isAnimatable };
