'use strict';

const { select } = require('../ui/select');
const commonCore = require('./commonCore');

async function mainMenu() {
  while (true) {
    const choice = await select({
      message: 'Which cursus are you working on?',
      choices: [
        { label: 'Common Core', value: 'common' },
        { label: 'Advanced Core', value: 'advanced', disabled: 'coming soon' },
        { label: 'Quit', value: 'quit' },
      ],
    });
    if (choice === 'common') {
      const back = await commonCore.run();
      if (back === 'quit') return;
    } else if (choice === 'quit') {
      return;
    }
  }
}

module.exports = { mainMenu };
