'use strict';

const c = require('./colors');
const { t } = require('../i18n');

const ART = [
  '   _  _  ____   ',
  '  | || ||___ \\  ',
  '  | || |_ __) | ',
  '  |__   _/ __/  ',
  '     |_||_____| ',
];

function banner() {
  const art = ART.map((l) => c.cyan(l)).join('\n');
  return `\n${art}\n  ${c.bold(t('banner.description'))}\n  ${c.dim(t('banner.credits'))}\n\n`;
}

module.exports = { banner };
