#!/usr/bin/env node

var path = require('path');
var System = require('systemjs');
require('./config');

// Tell SystemJS where the root is
var doveDir = path.dirname(process.argv[1]);
System.baseURL = doveDir;


var uriArgument = process.argv[2];

// FIXME: hack to allow passing header but no URL
if (uriArgument === '-') {
  uriArgument = undefined;
}

// TODO: or better, receive headers as CLI flags
var headerKey = process.argv[3];
var headerValue = process.argv[4];

var headers = {};
if (headerKey && headerValue) {
  headers[headerKey] = headerValue;
}


System.import('./lib/core').then(function(core) {
  var execution;
  if (uriArgument) {
    execution = core.run(uriArgument, headers);
  } else {
    execution = core.promptForUri().then(function(uri) {
      return core.run(uri, headers);
    });
  }

  execution.then(function() {
    process.exit(0);
  }).catch(function(error) {
    console.error(error.stack);
    process.exit(1);
  });
});
