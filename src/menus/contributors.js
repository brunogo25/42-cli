'use strict';

const { select } = require('../ui/select');
const { t, getLanguage } = require('../i18n');
const c = require('../ui/colors');
const contributors = require('../data/contributors');
const config = require('../utils/config');

function reasonOf(ct) {
  return getLanguage() === 'fr' && ct.reason_fr ? ct.reason_fr : ct.reason_en;
}

// Bundled contributors plus anyone who sent feedback from this machine. Local
// entries are deduped against the bundled list by login.
function allContributors() {
  const local = config.read().localContributors || [];
  const bundledLogins = new Set(contributors.map((ct) => ct.login));
  const extras = local.filter((ct) => !ct.login || !bundledLogins.has(ct.login));
  return [...contributors, ...extras];
}

async function contributorsMenu() {
  console.log();
  console.log(`  ${c.cyan(c.bold(t('contrib.title')))}\n`);
  console.log(`  ${c.dim(t('contrib.intro'))}\n`);
  for (const ct of allContributors()) {
    const youTag = ct.local ? ` ${c.green(t('contrib.youTag'))}` : '';
    const handles = [ct.login, ct.github && `github.com/${ct.github}`].filter(Boolean);
    console.log(`  ${c.cyan('·')} ${c.bold(ct.name)} ${c.dim(`(${handles.join(' · ') || '—'})`)}${youTag}`);
    const reason = reasonOf(ct);
    if (reason) console.log(`      ${c.dim('— ' + reason)}`);
  }
  console.log();
  await select({
    message: t('contrib.menuPrompt'),
    choices: [{ label: t('common.back'), value: 'back' }],
  });
}

module.exports = { contributorsMenu };
