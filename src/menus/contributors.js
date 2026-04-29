'use strict';

const { select } = require('../ui/select');
const { t } = require('../i18n');
const c = require('../ui/colors');
const contributors = require('../data/contributors');

async function contributorsMenu() {
  console.log();
  console.log(`  ${c.cyan(c.bold(t('contrib.title')))}\n`);
  console.log(`  ${c.dim(t('contrib.intro'))}\n`);
  for (const ct of contributors) {
    console.log(`  ${c.cyan('·')} ${c.bold(ct.name)} ${c.dim(`(${ct.login})`)}`);
  }
  console.log();
  await select({
    message: t('contrib.menuPrompt'),
    choices: [{ label: t('common.back'), value: 'back' }],
  });
}

module.exports = { contributorsMenu };
