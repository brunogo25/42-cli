'use strict';

const { select } = require('../ui/select');
const c = require('../ui/colors');
const { t } = require('../i18n');
const stats = require('../utils/stats');
const ach = require('../utils/achievements');

function progressBar(earned, total, width = 28) {
  const ratio = total === 0 ? 0 : earned / total;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return `${c.cyan('█'.repeat(filled))}${c.dim('░'.repeat(empty))}`;
}

function pct(earned, total) {
  if (!total) return '0%';
  return `${Math.round((earned / total) * 100)}%`;
}

function renderRow(a, isEarned) {
  const checkbox = isEarned ? c.green('✓') : c.dim('·');
  const badge = isEarned ? a.badge : c.dim('?');
  const name = isEarned ? c.bold(ach.nameOf(a)) : c.dim(ach.nameOf(a));
  const rarity = ach.paintRarity(a.rarity, `[${ach.rarityLabel(a.rarity)}]`);
  return `  ${checkbox} ${badge}  ${name} ${rarity}`;
}

function renderHiddenLockedRow() {
  return `  ${c.dim('·')} ${c.dim('?')}  ${c.dim('???')} ${c.dim(`[${ach.rarityLabel('secret')}]`)}`;
}

async function achievementsMenu() {
  stats.bumpAchievementsView();

  const snap = stats.snapshot();
  const earned = ach.unlockedSet(snap);
  const total = ach.TOTAL;
  const have = earned.size;

  console.log();
  console.log(`  ${c.cyan(c.bold(t('ach.title')))}  ${c.dim(`${have} / ${total}`)}`);
  console.log(`  ${progressBar(have, total)}  ${c.dim(pct(have, total))}`);
  console.log();

  // Sort: earned first within rarity, then unearned visible, then hidden locked at end
  const visible = [];
  const hiddenLocked = [];
  for (const a of ach.ACHIEVEMENTS) {
    if (a.hidden && !earned.has(a.id)) hiddenLocked.push(a);
    else visible.push(a);
  }
  // Group visible by rarity in canonical order
  const grouped = {};
  for (const a of visible) {
    if (!grouped[a.rarity]) grouped[a.rarity] = [];
    grouped[a.rarity].push(a);
  }

  for (const r of ach.RARITY_ORDER) {
    const group = grouped[r];
    if (!group || group.length === 0) continue;
    const earnedInGroup = group.filter((a) => earned.has(a.id)).length;
    console.log(
      `  ${ach.paintRarity(r, c.bold(ach.rarityLabel(r).toUpperCase()))} ` +
      `${c.dim(`(${earnedInGroup}/${group.length})`)}`
    );
    // earned first inside the group
    const sorted = group.slice().sort((a, b) => {
      const ae = earned.has(a.id) ? 0 : 1;
      const be = earned.has(b.id) ? 0 : 1;
      return ae - be;
    });
    for (const a of sorted) {
      console.log(renderRow(a, earned.has(a.id)));
      if (earned.has(a.id) || !a.hidden) {
        console.log(`     ${c.dim(ach.descOf(a))}`);
      }
    }
    console.log();
  }

  if (hiddenLocked.length > 0) {
    console.log(`  ${c.red(c.bold(t('ach.hiddenSection')))} ${c.dim(`(0/${hiddenLocked.length})`)}`);
    for (let i = 0; i < hiddenLocked.length; i++) {
      console.log(renderHiddenLockedRow());
    }
    console.log(`     ${c.dim(t('ach.hiddenHint'))}`);
    console.log();
  }

  await select({
    message: t('ach.menuPrompt'),
    choices: [{ label: t('common.back'), value: 'back' }],
  });
}

module.exports = { achievementsMenu };
