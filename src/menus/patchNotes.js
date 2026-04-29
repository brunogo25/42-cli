'use strict';

const { select } = require('../ui/select');
const { t, getLanguage } = require('../i18n');
const c = require('../ui/colors');
const changelog = require('../data/changelog');
const localPkg = require('../../package.json');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

function cmpSemver(a, b) {
  const pa = String(a || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

function notesFor(entry) {
  const lang = getLanguage();
  if (lang === 'fr' && entry.notes_fr && entry.notes_fr.length) return entry.notes_fr;
  return entry.notes_en || [];
}

function printEntry(entry, { highlight = false } = {}) {
  const star = highlight ? c.yellow('★') : c.cyan('★');
  const head = `v${entry.version}`;
  const date = entry.date ? c.dim(`  (${entry.date})`) : '';
  console.log(`  ${star} ${c.bold(head)}${date}`);
  for (const note of notesFor(entry)) {
    console.log(`    ${c.dim('·')} ${note}`);
  }
  console.log();
}

function entriesNewerThan(version) {
  if (!version) return [];
  return changelog.filter((e) => cmpSemver(e.version, version) > 0);
}

// Shown automatically right after the user upgrades to a new version.
// Returns true if anything was printed.
// Render oldest→newest so the latest version lands at the bottom, right
// above whatever comes next — terminals scroll down, no need to scroll up.
function showSinceLastRun(lastRunVersion) {
  const fresh = entriesNewerThan(lastRunVersion);
  if (!fresh.length) return false;
  const headline = fresh.length === 1
    ? t('patch.sinceLastSingle', { version: fresh[0].version })
    : t('patch.sinceLastMany', { count: fresh.length });
  console.log(`  ${c.yellow('✨')} ${c.bold(c.yellow(headline))}\n`);
  for (const e of [...fresh].reverse()) printEntry(e, { highlight: true });
  return true;
}

async function patchNotesMenu() {
  stats.bumpPatchNotes();
  ach.announceNew(ach.evaluate({ event: 'patch', now: new Date() }));

  // Same oldest→newest order so the freshest entry sits just above the prompt.
  const visible = changelog.slice(0, 8).reverse();
  console.log();
  console.log(`  ${c.cyan(c.bold(t('patch.title')))}\n`);
  for (const e of visible) {
    printEntry(e, { highlight: e.version === localPkg.version });
  }
  if (changelog.length > visible.length) {
    console.log(`  ${c.dim(t('patch.moreOnGithub'))}\n`);
  }
  await select({
    message: t('patch.menuPrompt'),
    choices: [{ label: t('common.back'), value: 'back' }],
  });
}

module.exports = { patchNotesMenu, showSinceLastRun };
