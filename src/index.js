'use strict';

const { banner } = require('./ui/banner');
const { mainMenu } = require('./menus/main');
const { pickLanguage, pickName } = require('./menus/settings');
const config = require('./utils/config');
const updater = require('./utils/updater');
const { t, getLanguage } = require('./i18n');
const c = require('./ui/colors');
const { pickMessage } = require('./ui/funfacts');
const { playRandomAnimation, play042Animation } = require('./ui/animations');
const { showSinceLastRun } = require('./menus/patchNotes');
const localPkg = require('../package.json');
const stats = require('./utils/stats');
const ach = require('./utils/achievements');

const ANIMATION_CHANCE = 1 / 18;
const POINT_42_CHANCE = 0.0042;

async function showFunMessage() {
  const cfg = config.read();
  const lang = getLanguage();
  const roll = Math.random();

  if (roll < POINT_42_CHANCE) {
    await play042Animation();
    stats.bumpFortyTwo();
    const newly = ach.evaluate({ event: 'point42', now: new Date() });
    ach.announceNew(newly);
    return;
  }

  if (roll < POINT_42_CHANCE + ANIMATION_CHANCE) {
    await playRandomAnimation();
    stats.bumpAnimation();
    const newly = ach.evaluate({ event: 'animation', now: new Date() });
    ach.announceNew(newly);
    const { index } = pickMessage(lang, cfg.lastFunIndex);
    config.write({ lastFunIndex: index });
    return;
  }

  const { index, text, isPhrase, relativeIndex } = pickMessage(lang, cfg.lastFunIndex);
  if (isPhrase) {
    console.log(`  ${c.dim('—')} ${text}\n`);
    stats.recordPhraseSeen(lang, relativeIndex);
    const newly = ach.evaluate({ event: 'phrase', text, now: new Date() });
    ach.announceNew(newly);
  } else {
    console.log(`  ${c.magenta(t('fun.didYouKnow'))} ${text}\n`);
    stats.recordFactSeen(lang, relativeIndex);
    const newly = ach.evaluate({ event: 'fact', text, now: new Date() });
    ach.announceNew(newly);
  }
  config.write({ lastFunIndex: index });
}

function printUpdateStatus(upd) {
  if (upd.available) {
    console.log(`  ${c.yellow('⚠')} ${c.yellow(c.bold(t('update.available', upd)))}`);
    console.log(`    ${c.dim(t('update.howTo'))}\n`);
    return;
  }
  if (!upd.reachable) {
    console.log(`  ${c.dim('·')} ${c.dim(t('update.offline'))}\n`);
    return;
  }
  console.log(`  ${c.green('✓')} ${c.dim(t('update.onLatest', { local: upd.local }))}\n`);
}

async function main() {
  let cfg = config.read();
  const needsLanguage = !cfg.language;
  const needsName = !cfg.name;

  process.stdout.write(banner());

  if (needsLanguage) {
    await pickLanguage();
  }
  if (needsName) {
    await pickName({ firstRun: true });
    process.stdout.write(banner());
  } else if (needsLanguage) {
    process.stdout.write(banner());
  }

  const upd = await updater.checkForUpdate();
  printUpdateStatus(upd);

  cfg = config.read();

  if (cfg.lastRunVersion) {
    showSinceLastRun(cfg.lastRunVersion);
  }
  if (cfg.lastRunVersion !== localPkg.version) {
    config.write({ lastRunVersion: localPkg.version });
  }

  // Track this launch + evaluate startup-time achievements (time-of-day,
  // streaks, day-count, etc.). Done before Hello so the toast appears
  // alongside the greeting.
  const now = new Date();
  const { daysAway } = stats.bumpLaunch(now);
  const launchNewly = ach.evaluate({ event: 'launch', now, daysAway });

  if (cfg.name) {
    console.log(`  ${c.bold(t('common.hello', { name: cfg.name }))}`);
  }
  ach.announceNew(launchNewly);
  await showFunMessage();

  try {
    await mainMenu({ update: upd });
  } finally {
    stats.flush();
    const finalName = config.read().name;
    const bye = finalName
      ? t('common.byeName', { name: finalName })
      : t('common.bye');
    process.stdout.write(`\n${c.dim(bye)}\n`);
  }
}

module.exports = { main };
