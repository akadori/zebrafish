const dummy = require('dummy');
const resolved = require.resolve('dummy');
const c= 1;
module.exports = {
  resolvedDummyModulePath: resolved,
  c,
};