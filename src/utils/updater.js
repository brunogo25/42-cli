'use strict';

const https = require('https');
const { spawn } = require('child_process');
const config = require('./config');
const localPkg = require('../../package.json');

const REPO = 'brunogo25/42-cli';
const BRANCH = 'main';
const REMOTE_PKG_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/package.json`;
const INSTALL_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/install.sh`;
const FETCH_TIMEOUT_MS = 1500;

function fetchJson(url, timeoutMs) {
  return new Promise((resolve) => {
    let data = '';
    const req = https.get(url, { headers: { 'User-Agent': '42-cli' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
  });
}

function cmpSemver(a, b) {
  const pa = String(a || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

function shape(remoteVersion) {
  const local = localPkg.version;
  return {
    local,
    remote: remoteVersion || null,
    available: !!(remoteVersion && cmpSemver(remoteVersion, local) > 0),
  };
}

async function checkForUpdate() {
  const cfg = config.read();
  const remote = await fetchJson(REMOTE_PKG_URL, FETCH_TIMEOUT_MS);
  if (!remote || !remote.version) {
    return { ...shape(cfg.lastSeenVersion), reachable: false };
  }
  config.write({ lastUpdateCheck: Date.now(), lastSeenVersion: remote.version });
  return { ...shape(remote.version), reachable: true };
}

function runUpdate() {
  return new Promise((resolve) => {
    const cmd = `curl -fsSL ${INSTALL_URL} | bash`;
    const child = spawn('bash', ['-c', cmd], { stdio: 'inherit' });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

module.exports = { checkForUpdate, runUpdate, INSTALL_URL, REMOTE_PKG_URL };
