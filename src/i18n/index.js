'use strict';

const config = require('../utils/config');

const tables = {
  en: require('./en'),
  fr: require('./fr'),
};

let active = null;

function getLanguage() {
  if (active) return active;
  const cfg = config.read();
  active = cfg.language && tables[cfg.language] ? cfg.language : 'en';
  return active;
}

function setLanguage(lang) {
  if (!tables[lang]) return false;
  active = lang;
  config.write({ language: lang });
  return true;
}

function listLanguages() {
  return Object.keys(tables);
}

function t(key, params) {
  const lang = getLanguage();
  let s = (tables[lang] && tables[lang][key]) || tables.en[key] || key;
  if (params) {
    for (const k of Object.keys(params)) {
      s = s.split(`{${k}}`).join(String(params[k]));
    }
  }
  return s;
}

module.exports = { t, getLanguage, setLanguage, listLanguages };
