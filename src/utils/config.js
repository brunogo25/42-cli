'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const CONFIG_DIR = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  '42-cli'
);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_STATS = {
  launches: 0,
  launchDays: [],
  lastLaunchDate: null,
  consecutiveDays: 0,
  todayDate: null,
  todayLaunches: 0,
  weekendLaunches: 0,
  factsSeenEn: [],
  factsSeenFr: [],
  phrasesSeenEn: [],
  phrasesSeenFr: [],
  animationsTriggered: 0,
  fortyTwoEvents: 0,
  patchNotesOpens: 0,
  settingsOpens: 0,
  achievementsOpens: 0,
  languageSwitches: 0,
  nameChanges: 0,
  testRuns: 0,
  testsPassed: 0,
  testsFailed: 0,
  failedFunctions: {},
  testedFunctions: {},
  norminetteRuns: 0,
  norminetteClean: 0,
  complianceRuns: 0,
  achievements: [],
};

const DEFAULTS = {
  language: null,
  name: null,
  lastUpdateCheck: 0,
  lastSeenVersion: null,
  lastFunIndex: -1,
  lastRunVersion: null,
  stats: DEFAULT_STATS,
};

function read() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      stats: { ...DEFAULT_STATS, ...(parsed.stats || {}) },
    };
  } catch {
    return { ...DEFAULTS, stats: { ...DEFAULT_STATS } };
  }
}

function write(patch) {
  const merged = { ...read(), ...patch };
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  } catch {
    /* config is best-effort; never crash on write failure */
  }
  return merged;
}

module.exports = { read, write, CONFIG_FILE, CONFIG_DIR, DEFAULT_STATS };
