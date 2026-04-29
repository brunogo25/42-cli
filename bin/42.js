#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'update' || cmd === '--update' || cmd === '-u') {
  require('../src/utils/updater').runUpdate().then((ok) => process.exit(ok ? 0 : 1));
} else if (cmd === '--version' || cmd === '-v') {
  // eslint-disable-next-line no-console
  console.log(require('../package.json').version);
  process.exit(0);
} else if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
  // eslint-disable-next-line no-console
  console.log('Usage: 42 [command]   (alias: 42cli)\n\nCommands:\n  (no args)   open the interactive menu\n  update      install the latest version from GitHub\n  --version   print the installed version\n');
  process.exit(0);
} else {
  require('../src/index.js').main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  });
}
