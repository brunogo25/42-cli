'use strict';

const config = require('./config');

let cache = null;

function load() {
  if (!cache) cache = config.read().stats;
  return cache;
}

function flush() {
  if (cache) config.write({ stats: cache });
}

function reset() {
  cache = null;
}

function isoDay(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(aIso, bIso) {
  const a = new Date(aIso);
  const b = new Date(bIso);
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function bumpLaunch(now = new Date()) {
  const s = load();
  const today = isoDay(now);

  s.launches = (s.launches || 0) + 1;

  s.launchDays = Array.isArray(s.launchDays) ? s.launchDays : [];
  if (!s.launchDays.includes(today)) s.launchDays.push(today);

  let daysAway = 0;
  if (s.lastLaunchDate) {
    const gap = daysBetween(s.lastLaunchDate, today);
    if (gap === 0) {
      // same day — keep streak
    } else if (gap === 1) {
      s.consecutiveDays = (s.consecutiveDays || 0) + 1;
    } else if (gap > 1) {
      s.consecutiveDays = 1;
      daysAway = gap;
    }
  } else {
    s.consecutiveDays = 1;
  }
  s.lastLaunchDate = today;

  if (s.todayDate !== today) {
    s.todayDate = today;
    s.todayLaunches = 1;
  } else {
    s.todayLaunches = (s.todayLaunches || 0) + 1;
  }

  const dow = now.getDay();
  if (dow === 0 || dow === 6) s.weekendLaunches = (s.weekendLaunches || 0) + 1;

  flush();
  return { daysAway };
}

function recordFactSeen(lang, index) {
  const s = load();
  const key = lang === 'fr' ? 'factsSeenFr' : 'factsSeenEn';
  s[key] = Array.isArray(s[key]) ? s[key] : [];
  if (!s[key].includes(index)) s[key].push(index);
}

function recordPhraseSeen(lang, index) {
  const s = load();
  const key = lang === 'fr' ? 'phrasesSeenFr' : 'phrasesSeenEn';
  s[key] = Array.isArray(s[key]) ? s[key] : [];
  if (!s[key].includes(index)) s[key].push(index);
}

function bumpAnimation() {
  const s = load();
  s.animationsTriggered = (s.animationsTriggered || 0) + 1;
}

function bumpFortyTwo() {
  const s = load();
  s.fortyTwoEvents = (s.fortyTwoEvents || 0) + 1;
}

function bumpPatchNotes() {
  const s = load();
  s.patchNotesOpens = (s.patchNotesOpens || 0) + 1;
}

function bumpSettings() {
  const s = load();
  s.settingsOpens = (s.settingsOpens || 0) + 1;
}

function bumpAchievementsView() {
  const s = load();
  s.achievementsOpens = (s.achievementsOpens || 0) + 1;
}

function bumpLanguageSwitch() {
  const s = load();
  s.languageSwitches = (s.languageSwitches || 0) + 1;
}

function bumpNameChange() {
  const s = load();
  s.nameChanges = (s.nameChanges || 0) + 1;
}

function recordTestRun({ targets, passed }) {
  const s = load();
  s.testRuns = (s.testRuns || 0) + 1;
  if (passed) s.testsPassed = (s.testsPassed || 0) + 1;
  else s.testsFailed = (s.testsFailed || 0) + 1;

  s.testedFunctions = s.testedFunctions || {};
  s.failedFunctions = s.failedFunctions || {};
  for (const fn of targets || []) {
    s.testedFunctions[fn] = (s.testedFunctions[fn] || 0) + 1;
    if (!passed) s.failedFunctions[fn] = (s.failedFunctions[fn] || 0) + 1;
  }
}

function recordNorminetteRun({ clean }) {
  const s = load();
  s.norminetteRuns = (s.norminetteRuns || 0) + 1;
  if (clean) s.norminetteClean = (s.norminetteClean || 0) + 1;
}

function recordComplianceRun() {
  const s = load();
  s.complianceRuns = (s.complianceRuns || 0) + 1;
}

function unlockAchievement(id) {
  const s = load();
  s.achievements = Array.isArray(s.achievements) ? s.achievements : [];
  if (!s.achievements.includes(id)) {
    s.achievements.push(id);
    flush();
    return true;
  }
  return false;
}

function snapshot() {
  return load();
}

module.exports = {
  load, flush, reset, snapshot,
  bumpLaunch,
  recordFactSeen, recordPhraseSeen,
  bumpAnimation, bumpFortyTwo,
  bumpPatchNotes, bumpSettings, bumpAchievementsView,
  bumpLanguageSwitch, bumpNameChange,
  recordTestRun, recordNorminetteRun, recordComplianceRun,
  unlockAchievement,
};
