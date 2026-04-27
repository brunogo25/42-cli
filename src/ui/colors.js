'use strict';

const codes = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const wrap = (code) => (text) => `${code}${text}${codes.reset}`;

module.exports = {
  red: wrap(codes.red),
  green: wrap(codes.green),
  yellow: wrap(codes.yellow),
  blue: wrap(codes.blue),
  magenta: wrap(codes.magenta),
  cyan: wrap(codes.cyan),
  gray: wrap(codes.gray),
  bold: wrap(codes.bold),
  dim: wrap(codes.dim),
  raw: codes,
};
