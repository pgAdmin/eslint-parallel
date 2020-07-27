# eslint-parallel
Tiny eslint wrapper to allow executing javascript linting in parallel.

This is a fork of the original project, in order to update the version of eslint being used. 
As there are a number of PRs that have been waiting to be merged for a while in the original,
I decided to publish this as I need it.

## Install

```command
npm install eslint-parallel
```

## Access CLI

```command
node_modules/.bin/eslint-parallel src/js/**
```

## Options

See [ESLint Docs](http://eslint.org/docs/user-guide/command-line-interface) for all the options

### CPU Count

If you need to override the CPU count (e.g. on CI), you can use the environment variable `ESLINT_CPU_COUNT`.

## API Usage

```javascript
  import Linter from 'eslint-parallel';
  new Linter({
    cache: true,
    cwd: process.cwd()
  }).execute(['src/js/**']).then(
    (result) => {
      const failed = result.errorCount || result.warningCount;

      if (failed) {
        // failed
      } else {
        // passed
      }
    },
    (err) => {
      console.log(err);
      process.exit(1);
    }
  );
```
