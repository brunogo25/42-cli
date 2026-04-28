'use strict';

const { banner } = require('./ui/banner');
const { mainMenu } = require('./menus/main');
const { pickLanguage } = require('./menus/settings');
const config = require('./utils/config');
const updater = require('./utils/updater');
const { t } = require('./i18n');
const c = require('./ui/colors');

async function main() {
  const cfg = config.read();
  const isFirstRun = !cfg.language;

  process.stdout.write(banner());

  if (isFirstRun) {
    await pickLanguage();
    process.stdout.write(banner());
  }

  const upd = await updater.checkForUpdate();
  if (upd.available) {
    console.log(
      `  ${c.yellow(t('update.available', upd))} ${c.dim(t('update.howTo'))}\n`
    );
  }

  try {
    await mainMenu({ update: upd });
  } finally {
    process.stdout.write(`\n${c.dim(t('common.bye'))}\n`);
  }
}

module.exports = { main };
