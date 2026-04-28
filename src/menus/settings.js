'use strict';

const { select } = require('../ui/select');
const { input } = require('../ui/input');
const { t, setLanguage, getLanguage } = require('../i18n');
const updater = require('../utils/updater');
const config = require('../utils/config');
const c = require('../ui/colors');

function sanitizeName(raw) {
  return String(raw || '')
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, 32);
}

async function pickName({ firstRun = false } = {}) {
  const current = config.read().name;
  while (true) {
    const answer = await input({
      message: firstRun ? t('firstRun.askName') : t('settings.namePrompt'),
      defaultValue: firstRun ? '' : current || '',
    });
    const name = sanitizeName(answer);
    if (!name) {
      if (!firstRun) return;
      console.log(`  ${c.yellow(t('firstRun.nameRequired'))}`);
      continue;
    }
    config.write({ name });
    console.log(`  ${c.green('✓')} ${c.dim(t('settings.nameSaved', { name }))}`);
    return name;
  }
}

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
        { label: t('settings.name'), value: 'name' },
        { label: t('settings.language'), value: 'language' },
        { label: t('settings.checkUpdates'), value: 'check' },
        { label: t('common.back'), value: 'back' },
      ],
    });
    if (choice === 'name') await pickName();
    else if (choice === 'language') await pickLanguage();
    else if (choice === 'check') await manualUpdateCheck();
    else if (choice === 'back') return;
  }
}

module.exports = { settingsMenu, pickLanguage, pickName, manualUpdateCheck };
