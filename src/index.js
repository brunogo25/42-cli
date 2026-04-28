'use strict';

const { banner } = require('./ui/banner');
const { mainMenu } = require('./menus/main');
const { pickLanguage, pickName } = require('./menus/settings');
const config = require('./utils/config');
const updater = require('./utils/updater');
const { t } = require('./i18n');
const c = require('./ui/colors');

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

  cfg = config.read();
  if (cfg.name) {
    console.log(`  ${c.bold(t('common.hello', { name: cfg.name }))}\n`);
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
    const finalName = config.read().name;
    const bye = finalName
      ? t('common.byeName', { name: finalName })
      : t('common.bye');
    process.stdout.write(`\n${c.dim(bye)}\n`);
  }
}

module.exports = { main };
