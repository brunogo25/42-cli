'use strict';

const { banner } = require('./ui/banner');
const { mainMenu } = require('./menus/main');
const c = require('./ui/colors');

async function main() {
  process.stdout.write(banner());
  try {
    await mainMenu();
  } finally {
    process.stdout.write(`\n${c.dim('bye!')}\n`);
  }
}

module.exports = { main };
