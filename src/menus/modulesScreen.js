'use strict';

const { moduleNav } = require('../ui/moduleNav');
const { MODULES } = require('../data/modules');
const { byId: pyById } = require('../data/pythonProjects');
const libft = require('./libft');
const ftPrintf = require('./ftPrintf');
const gnl = require('./gnl');
const pushSwap = require('./pushSwap');
const pythonPiscine = require('./pythonPiscine');
const examSelect = require('./examSelect');

// Launch the menu behind a chosen submodule. Returns the same 'back' / 'quit'
// contract every submenu uses, so quit propagates up to the main loop.
async function launch(module, submodule) {
  if (submodule.exam) {
    return examSelect.runForModule(module);
  }
  switch (submodule.id) {
    case 'libft':
      return libft.run();
    case 'printf':
      return ftPrintf.run();
    case 'gnl':
      return gnl.run();
    case 'push_swap':
      return pushSwap.run();
    default: {
      // any python submodule maps to a project in pythonProjects.js
      const project = pyById(submodule.id);
      if (project) return pythonPiscine.projectMenu(project);
      return 'back';
    }
  }
}

async function run() {
  while (true) {
    const result = await moduleNav({ modules: MODULES });
    if (!result || result.action === 'back') return 'back';

    const back = await launch(result.module, result.submodule);
    if (back === 'quit') return 'quit';
  }
}

module.exports = { run };
