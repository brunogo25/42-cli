#!/usr/bin/env node
require('../src/index.js').main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
