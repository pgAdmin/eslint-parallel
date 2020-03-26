#!/usr/bin/env node
require('babel-register');

/**
* NPM dependencies
**/
import options from 'eslint/lib/options';

/**
* Local dependencies
**/
import Linter from './linter';
import { formatTotal } from './formatter';

function translateOptions(cliOptions) {
  return {
    envs: cliOptions.env,
    extensions: cliOptions.ext,
    rules: cliOptions.rule,
    plugins: cliOptions.plugin,
    globals: cliOptions.global,
    ignore: cliOptions.ignore,
    ignorePath: cliOptions.ignorePath,
    ignorePattern: cliOptions.ignorePattern,
    configFile: cliOptions.config,
    rulePaths: cliOptions.rulesdir,
    useEslintrc: cliOptions.eslintrc,
    parser: cliOptions.parser,
    parserOptions: cliOptions.parserOptions,
    cache: cliOptions.cache,
    cacheFile: cliOptions.cacheFile,
    cacheLocation: cliOptions.cacheLocation,
    fix: cliOptions.fix,
    allowInlineConfig: cliOptions.inlineConfig,
    reportUnusedDisableDirectives: cliOptions.reportUnusedDisableDirectives
  };
}

const cliOptions = options.parse(process.argv);

if (cliOptions.version) {
  console.log(`v${require("../package.json").version}`);
} else if (cliOptions.help) {
  console.log(options.generateHelp());
} else {
  new Linter(translateOptions(cliOptions)).execute(cliOptions._).then(
    (result) => {
      const failed = result.errorCount || result.warningCount;

      if (failed) {
        console.log(formatTotal(result));
        process.exit(1);
      } else {
        process.exit(0);
      }
    },
    (err) => {
      console.log(err);
      process.exit(1);
    }
  );
}
