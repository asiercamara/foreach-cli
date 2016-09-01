#!/usr/bin/env node
// Generated by CoffeeScript 1.10.0
(function() {
  var Listr, args, chalk, commandToExecute, concurrent, exec, executeCommand, finalLogs, forceColor, fs, getDirName, glob, globToRun, help, options, outputFinalLogs, path, regEx, yargs;

  options = {
    'g': {
      alias: 'glob',
      describe: 'Specify the glob ',
      type: 'string'
    },
    'x': {
      alias: 'execute',
      describe: 'Command to execute upon file addition/change',
      type: 'string'
    },
    'c': {
      alias: 'forceColor',
      describe: 'Force color TTY output (pass --no-c to disable)',
      type: 'boolean',
      "default": true
    },
    'C': {
      alias: 'concurrent',
      describe: 'Execute commands concurrently (pass --no-C to disable)',
      type: 'boolean',
      "default": true
    }
  };

  fs = require('fs');

  path = require('path');

  glob = require('glob');

  chalk = require('chalk');

  Listr = require('@danielkalen/listr');

  exec = require('child_process').exec;

  yargs = require('yargs').usage("Usage: -g <glob> -x <command>  |or|  <glob> <command>\nPlaceholders can be either noted with double curly braces {{name}} or hash+surrounding curly braces \#{name}").options(options).help('h').wrap(null).version();

  args = yargs.argv;

  globToRun = args.g || args.glob || args._[0];

  commandToExecute = args.x || args.execute || args._[1];

  forceColor = args.c || args.forceColor;

  concurrent = args.C || args.concurrent;

  help = args.h || args.help;

  regEx = {
    placeholder: /(?:\#\{|\{\{)([^\/\}]+)(?:\}\}|\})/ig
  };

  finalLogs = {
    'log': {},
    'error': {}
  };

  if (help || !globToRun || !commandToExecute) {
    process.stdout.write(yargs.help());
    process.exit(0);
  }

  glob(globToRun, function(err, files) {
    var tasks;
    if (err) {
      return console.error(err);
    } else {
      tasks = new Listr(files.map((function(_this) {
        return function(file) {
          return {
            title: "Executing command: " + (chalk.dim(file)),
            task: function() {
              return executeCommand(file);
            }
          };
        };
      })(this)), {
        concurrent: concurrent
      });
      return tasks.run().then(outputFinalLogs, outputFinalLogs);
    }
  });

  executeCommand = function(filePath) {
    return new Promise(function(resolve, reject) {
      var command, pathParams;
      pathParams = path.parse(path.resolve(filePath));
      pathParams.reldir = getDirName(pathParams, path.resolve(filePath));
      command = commandToExecute.replace(regEx.placeholder, function(entire, placeholder) {
        switch (false) {
          case placeholder !== 'path':
            return filePath;
          case pathParams[placeholder] == null:
            return pathParams[placeholder];
          default:
            return entire;
        }
      });
      if (forceColor) {
        command = "FORCE_COLOR=true " + command;
      }
      return exec(command, function(err, stdout, stderr) {
        if (stdout) {
          finalLogs.log[filePath] = stdout;
        }
        if (stderr && !err) {
          finalLogs.log[filePath] = err;
        } else if (err) {
          finalLogs.error[filePath] = stderr || err;
        }
        if (err) {
          return reject();
        } else {
          return resolve();
        }
      });
    });
  };

  getDirName = function(pathParams, filePath) {
    var dirInGlob;
    dirInGlob = globToRun.match(/^[^\*\/]*/)[0];
    dirInGlob += dirInGlob ? '/' : '';
    return filePath.replace(pathParams.base, '').replace(process.cwd() + ("/" + dirInGlob), '').slice(0, -1);
  };

  outputFinalLogs = function() {
    var file, message, ref, ref1, results;
    if (Object.keys(finalLogs.log).length || Object.keys(finalLogs.error).length) {
      process.stdout.write('\n\n');
      ref = finalLogs.log;
      for (file in ref) {
        message = ref[file];
        console.log(chalk.bgWhite.black.bold("Output") + ' ' + chalk.dim(file));
        console.log(message);
      }
      ref1 = finalLogs.error;
      results = [];
      for (file in ref1) {
        message = ref1[file];
        console.log(chalk.bgRed.white.bold("Error") + ' ' + chalk.dim(file));
        results.push(console.log(message));
      }
      return results;
    }
  };

}).call(this);
