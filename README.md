# eslint-parallel
Tiny eslint wrapper to allow executing javascript linting in parallel.

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

## API Usage

```javascript
  import Linter from 'eslint-parallel';
  new Linter({
    cache: true,
    cwd: process.cwd()
  }).execute(['src/js/**']).then(
    (result) => {
      const failed = result.errorCount > 1 || result.warningCount > 1;

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
