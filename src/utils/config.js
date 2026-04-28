'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const CONFIG_DIR = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  '42-cli'
);
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULTS = {
  language: null,
  name: null,
  lastUpdateCheck: 0,
  lastSeenVersion: null,
};

function read() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
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

module.exports = { read, write, CONFIG_FILE, CONFIG_DIR };
