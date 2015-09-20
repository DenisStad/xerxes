/*
 * xerxes.js
 *
 */

var fs = require('fs');
var path = require('path');
var callsite = require('callsite');

exports = module.exports = function(appDir) {
  if (!appDir) {
    var stack = callsite();
    var caller = stack[1].getFileName();
    appDir = path.dirname(caller);
  }

  return {
    appDir: appDir,
    exists: function(path) {
      try {
        var stat = fs.statSync(path);
        return true;
      } catch (e) {
        return false;
      }
    },
    find: function(name, baseDir, fromThis) {
      var normalizedName = name.split('/').join(path.sep);

      var exists = this.exists;
      function checkBoth(modulePath) {
        if (exists(modulePath)) {
          if (path.parse(modulePath).ext === '.js') {
            modulePath = modulePath.substr(0, modulePath.length - 3);
          }
          return modulePath;
        }
        if (exists(modulePath + '.js')) {
          return modulePath;
        }
        return false;
      }

      var appDir = this.appDir;
      if (baseDir) {
        appDir = baseDir;
      }

      // this should find items in the app's dir such as some/thing and some/thing.js and returns /absolute/some/thing if exists
      var modulePath = path.resolve(path.join(appDir, normalizedName));
      var pathIfExists = checkBoth(modulePath);
      if (pathIfExists) return pathIfExists;

      // name from caller's node_modules dir
      if (baseDir) {
        modulePath = baseDir;
      } else {
        var stack = callsite();
        var caller = stack[fromThis ? 2 : 1].getFileName();
        modulePath = path.dirname(caller);
      }
      var doMore = true;
      while (doMore) {
        var modulePathFull = path.join(modulePath, 'node_modules', normalizedName);
        doMore = path.parse(modulePath).root !== modulePath;
        modulePath = path.resolve(path.join(modulePath, '..'));
        if (checkBoth(modulePathFull)) {
          return modulePathFull;
        }
      }

      // xx-name from caller's node_modules dir
      var modulePath = path.dirname(caller);
      var doMore = true;
      while (doMore) {
        var modulePathFull = path.join(modulePath, 'node_modules', 'xx-' + normalizedName);
        doMore = path.parse(modulePath).root !== modulePath;
        modulePath = path.resolve(path.join(modulePath, '..'));
        if (checkBoth(modulePathFull)) {
          return modulePathFull;
        }
      }

      // xerxes-name from caller's node_modules dir
      var modulePath = path.dirname(caller);
      var doMore = true;
      while (doMore) {
        var modulePathFull = path.join(modulePath, 'node_modules', 'xerxes-' + normalizedName);
        doMore = path.parse(modulePath).root !== modulePath;
        modulePath = path.resolve(path.join(modulePath, '..'));
        if (checkBoth(modulePathFull)) {
          return modulePathFull;
        }
      }
      
      return null;
    },
    load: function(name) {
      var modulePath = this.find(name, false, true);
      if (!modulePath) {
        throw new Error("Module not found: " + name);
      }
      var module = require(modulePath);
      var args = [ this ];
      for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      return module.apply(module, args);
    },

    models: {},

    environment: {
      isProduction: function() {
        return process.env.NODE_ENV === 'production';
      },
      isLocal: function() {
        return process.env.NODE_ENV === 'local';
      },
      isTest: function() {
        return process.env.NODE_ENV === 'test';
      },
      isDevelopment: function() {
        return this.env === 'development';
      },
      env: process.env.NODE_ENV || 'development'
    },

    configuration: {}
  };
};
