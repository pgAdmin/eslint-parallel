/**
* Node dependencies
**/
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fork } from 'child_process';

/**
* NPM dependencies
**/
import { CLIEngine } from 'eslint';
import glob from 'glob';

/**
* Local dependencies
**/
import { formatResults } from './formatter';

const cpuCount = os.cpus().length;

function getIgnorePatterns(options) {
  let ignorePath = path.join(options.cwd || process.cwd(), '.eslintignore');
  try {
    const ignore = fs.readFileSync(
      ignorePath, 'utf8'
    ).trim().split('\n');

    if (options.ignorePattern) {
      ignore.push(options.ignorePattern);
    }
    return ignore;
  } catch (e) {
    return [];
  }
}

function hasEslintCache(options) {
  const cacheLocation = (
    options.cacheFile || options.cacheLocation || path.join(
      options.cwd || process.cwd(), '.eslintcache'
    )
  );
  try {
    fs.accessSync(path.resolve(cacheLocation), fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

function getFilesByPatterns(patterns, options) {
  const ignore = getIgnorePatterns(options);
  let files = [];

  patterns.forEach(pattern => {
    let isFile = false;
    let isFolder = false;
    try {
      const stats = fs.lstatSync(pattern);
      isFile = stats.isFile();
      isFolder = stats.isDirectory();
    } catch (e) {
      //no-op
    }

    if (isFile) {
      files.push(pattern);
    } else {
      const path = isFolder ? `${pattern.replace(/\'|\"|\/$/g, '')}/**` :
        pattern.replace(/\'|\"|\/$/g, '');
      const newFiles = glob.sync(
        path, { cwd: options.cwd || process.cwd(), nodir: true, ignore }
      );
      files = files.concat(newFiles);
    }
  });

  return files;
}

function eslintFork(options, files) {
  return new Promise((resolve, reject) => {
    const eslintChild = fork(path.resolve(__dirname, 'linter'));
    eslintChild.on('message', (report) => {
      if (report.errorCount || report.warningCount) {
        console.log(formatResults(report.results));
      }
      resolve(report);
    });
    eslintChild.on('exit', (code) => {
      if (code !== 0) {
        reject('Linting failed');
      }
    });
    eslintChild.send({options, files});
  });
}

export default class Linter {
  constructor (options) {
    this._options = options;
    this._engine = new CLIEngine(options);
  }

  run (files) {
    return new Promise((resolve) => {
      const report = this._engine.executeOnFiles(files);
      if (this._options.fix) {
        this._engine.outputFixes(report);
      }

      if (this._options.quiet) {
        report.results = this._engine.getErrorResults(report.results);
      }
      resolve(report);
    });
  }

  execute(patterns) {
    return new Promise((resolve, reject) => {
      const files = getFilesByPatterns(
        patterns, this._options
      );

      const hasCache = hasEslintCache(this._options);

      if (!hasCache && files.length > 50 && cpuCount >= 2) {
        // too many items, need to spawn process (if machine has multi-core)
        const totalCount = {
          errorCount: 0,
          warningCount: 0
        };
        const chunckedPromises = [];
        const chunkSize = Math.ceil(files.length / cpuCount);
        for (let i = 0; i < files.length; i += chunkSize) {
          const chunkedPaths = files.slice(i, i + chunkSize);
          const chunckedPromise = eslintFork(
            this._options, chunkedPaths
          );
          chunckedPromise.then((report) => {
            totalCount.errorCount += report.errorCount;
            totalCount.warningCount += report.warningCount;
          });
          chunckedPromises.push(chunckedPromise);
        }
        Promise.all(chunckedPromises).then(() => {
          resolve(totalCount);
        });
      } else {
        this.run(files).then((report) => {
          if (report.errorCount || report.warningCount) {
            console.log(formatResults(report.results));
          }
          resolve(report);
        }, reject);
      }
    });
  }
}

process.on('message', ({options, files}) => {
  new Linter(options).run(files).then((report) => {
    process.send(report);
  }, (err) => {
    console.log(err);
    process.exit(1);
  });
});
