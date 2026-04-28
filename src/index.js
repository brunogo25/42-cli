'use strict';

const { banner } = require('./ui/banner');
const { mainMenu } = require('./menus/main');
const { pickLanguage, pickName } = require('./menus/settings');
const config = require('./utils/config');
const updater = require('./utils/updater');
const { t, getLanguage } = require('./i18n');
const c = require('./ui/colors');
const { pickMessage } = require('./ui/funfacts');
const { playRandomAnimation } = require('./ui/animations');

const ANIMATION_CHANCE = 1 / 18;

async function showFunMessage() {
  const cfg = config.read();
  if (Math.random() < ANIMATION_CHANCE) {
    await playRandomAnimation();
    const { index } = pickMessage(getLanguage(), cfg.lastFunIndex);
    config.write({ lastFunIndex: index });
    return;
  }
  const { index, text, isPhrase } = pickMessage(getLanguage(), cfg.lastFunIndex);
  const label = isPhrase ? t('fun.vibe') : t('fun.didYouKnow');
  console.log(`  ${c.magenta(label)} ${text}\n`);
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
  if (cfg.name) {
    console.log(`  ${c.bold(t('common.hello', { name: cfg.name }))}`);
  }
  await showFunMessage();

  try {
    await mainMenu({ update: upd });
  } finally {
    const finalName = config.read().name;
    const bye = finalName
      ? t('common.byeName', { name: finalName })
      : t('common.bye');
    process.stdout.write(`\n${c.dim(bye)}\n`);
  }
}

module.exports = { main };
