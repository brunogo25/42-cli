'use strict';

const { select } = require('../ui/select');
const commonCore = require('./commonCore');
const { settingsMenu, manualUpdateCheck } = require('./settings');
const { t } = require('../i18n');

async function mainMenu(ctx = {}) {
  while (true) {
    const upd = ctx.update;
    const choices = [];
    if (upd && upd.available) {
      choices.push({
        label: t('update.menuItem', { local: upd.local, remote: upd.remote }),
        value: 'update',
      });
    }
    choices.push({ label: t('main.commonCore'), value: 'common' });
    choices.push({ label: t('main.advancedCore'), value: 'advanced', disabled: t('common.comingSoon') });
    choices.push({ label: t('main.settings'), value: 'settings' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const choice = await select({
      message: t('main.cursus'),
      choices,
      shortcuts: upd && upd.available ? { '/': 'update' } : undefined,
    });

    if (choice === 'update') {
      await manualUpdateCheck();
    } else if (choice === 'common') {
      const back = await commonCore.run();
      if (back === 'quit') return;
    } else if (choice === 'settings') {
      await settingsMenu();
    } else if (choice === 'quit') {
      return;
    }
  }
}

module.exports = { mainMenu };
