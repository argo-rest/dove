import {Client} from 'theseus';
// FIXME: distribute as client
import {Http} from './any-http-request';

import uriTemplates from 'uri-templates';
import readline from 'readline';


function getClient(headers = {}) {
  return new Client({
    http: new Http({ headers }),
    promise: Promise
  });
};

export function promptForUri() {
  return prompt("Enter the root URI of an argo API: ");
};

// TODO: pass in headers
export function run(apiUri, headers) {
  const client = getClient(headers);
  return load(client, apiUri);
};


function load(client, uri, headers = {}) {
  return client.resource(uri).get({}, {headers}).then(function(res) {
    // TODO: expose status?
    // console.log(">> " + res.status);
    console.log("Data");
    printJson(res.data);
    console.log();

    console.log("Links");
    res.links.forEach(link => {
      console.log("- " + link.rel + ': ' + link.href);
    });
    return ask(client, res, uri);
  });
}

function ask(client, responseObject, uri) {
  return prompt("> ").then(input => {
    var tokens = input.split(' ');
    var command = tokens[0];
    var args = tokens.slice(1);
    switch(command) {
    case 'uri':
      console.log(responseObject.uri);
      return ask(client, responseObject, uri);
      break;

    case 'data':
      // TODO: path expression to select
      printJson(responseObject.data);
      return ask(client, responseObject, uri);
      break;

    case 'links':
      responseObject.links.forEach(link => {
        console.log("- " + link.rel + ': ' + link.href);
      });
      return ask(client, responseObject, uri);
      break;

    case 'follow':
      const rel = args[0];
      return responseObject.getLink(rel).then(link => {
        // FIXME: expose via theseus
        const template = uriTemplates(link.href);

        // prompt for parameters
        let parameters = template.varNames.reduce(function(paramsPromise, name) {
          // TODO: optional vs required?
          return paramsPromise.then(params => {
            return prompt('Parameter \'' + name + '\': ').then(value => {
              if (value) {
                params[name] = value;
              }
              return params;
            });
          });
        }, Promise.resolve({}));

        return parameters.then(params => {
          // FIXME: why not use follow()?
          // return responseObject.follow(rel, params)
          // move to that state
          return load(client, template.fillFromObject(params));
        });
      }).catch(err => {
        console.error("no such link");
        return ask(client, responseObject, uri);
      });
      break;

    case 'get':
      // TODO: GET
      break;

      // TODO: allow following link in browser to extract cookie?

      // TODO: post, put, delete

    // FIXME: fix
    // case 'at':
    //   const path = args[0];
    //   return ask(client, responseObject.data[path], responseObject.data[path].uri)
    //   break;

      // TODO: at (collection item, embedded entity)
      // TODO: iff collection: next, prev, slice

      // TODO: help to list commands

      // TODO: back, forward, history

    // case 'root':
    //   // FIXME: need to pass initial uri along
    //   return rootUri.then(load);
    //   break;

    case '':
      // noop
      return ask(client, responseObject, uri);
      break;

    case 'exit':
      // stop recursion
      break;

    default:
      console.error("invalid command: " + command);
      return ask(client, responseObject, uri);
      break;
    }
  });
}


function prompt(q) {
  return new Promise((resolve) => {
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(q, answer => {
      rl.close();

      resolve(answer);
    });
  });
}


var util = require('util');
function printJson(obj) {
  console.log(util.inspect(obj, {colors: true}));
}
