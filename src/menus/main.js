'use strict';

const { select } = require('../ui/select');
const modulesScreen = require('./modulesScreen');
const examSelect = require('./examSelect');
const { settingsMenu, manualUpdateCheck } = require('./settings');
const { patchNotesMenu } = require('./patchNotes');
const { achievementsMenu } = require('./achievements');
const { contributorsMenu } = require('./contributors');
const { feedbackMenu } = require('./feedback');
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
    choices.push({ label: t('main.modules'), value: 'modules' });
    choices.push({ label: t('main.examPractice'), value: 'exam' });
    choices.push({ label: t('main.achievements'), value: 'achievements' });
    choices.push({ label: t('main.patchNotes'), value: 'patch' });
    choices.push({ label: t('main.contributors'), value: 'contributors' });
    choices.push({ label: t('main.feedback'), value: 'feedback' });
    choices.push({ label: t('main.settings'), value: 'settings' });
    choices.push({ label: t('common.quit'), value: 'quit' });

    const choice = await select({
      message: t('main.cursus'),
      choices,
      shortcuts: upd && upd.available ? { '/': 'update' } : undefined,
    });

    if (choice === 'update') {
      await manualUpdateCheck();
    } else if (choice === 'modules') {
      const back = await modulesScreen.run();
      if (back === 'quit') return;
    } else if (choice === 'exam') {
      const back = await examSelect.run();
      if (back === 'quit') return;
    } else if (choice === 'patch') {
      await patchNotesMenu();
    } else if (choice === 'achievements') {
      await achievementsMenu();
    } else if (choice === 'contributors') {
      await contributorsMenu();
    } else if (choice === 'feedback') {
      await feedbackMenu();
    } else if (choice === 'settings') {
      await settingsMenu();
    } else if (choice === 'quit') {
      return;
    }
  }
}

module.exports = { mainMenu };
