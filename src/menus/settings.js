'use strict';

const { select } = require('../ui/select');
const { t, setLanguage, getLanguage } = require('../i18n');
const updater = require('../utils/updater');
const c = require('../ui/colors');

async function pickLanguage() {
  const current = getLanguage();
  const choice = await select({
    message: t('firstRun.pickLanguage'),
    choices: [
      { label: `English${current === 'en' ? '  (current)' : ''}`, value: 'en' },
      { label: `Français${current === 'fr' ? '  (actuel)' : ''}`, value: 'fr' },
      { label: t('common.back'), value: 'back' },
    ],
  });
  if (choice === 'back') return;
  setLanguage(choice);
  console.log(`  ${c.green('✓')} ${c.dim(t('settings.languageSaved'))}`);
}

async function manualUpdateCheck() {
  console.log(`  ${c.dim(t('update.checking'))}`);
  const r = await updater.checkForUpdate({ force: true });
  if (!r.remote) {
    console.log(`  ${c.yellow(t('update.unreachable'))}`);
    return;
  }
  if (!r.available) {
    console.log(`  ${c.green(t('update.upToDate', { local: r.local }))}`);
    return;
  }
  console.log(`  ${t('update.available', r)}`);
  const ok = await select({
    message: t('update.confirm'),
    choices: [
      { label: t('common.yes'), value: 'yes' },
      { label: t('common.no'), value: 'no' },
    ],
  });
  if (ok !== 'yes') return;
  console.log(`  ${c.dim(t('update.running'))}`);
  const success = await updater.runUpdate();
  console.log(success ? `  ${c.green(t('update.done'))}` : `  ${c.red(t('update.failed'))}`);
}

async function settingsMenu() {
  while (true) {
    const choice = await select({
      message: t('settings.title'),
      choices: [
        { label: t('settings.language'), value: 'language' },
        { label: t('settings.checkUpdates'), value: 'check' },
        { label: t('common.back'), value: 'back' },
      ],
    });
    if (choice === 'language') await pickLanguage();
    else if (choice === 'check') await manualUpdateCheck();
    else if (choice === 'back') return;
  }
}

module.exports = { settingsMenu, pickLanguage, manualUpdateCheck };
