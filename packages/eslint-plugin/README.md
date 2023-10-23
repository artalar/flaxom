## Installation

```sh
npm i -D @reatom/eslint-plugin
```

## Usage

You should add `@reatom` to `plugins` and specify `extends` or `rules` into your config.

```json
{
  "plugins": ["@reatom"],
  "extends": ["plugin:@reatom/recommended"]
}
```

```json
{
  "plugins": ["@reatom"],
  "rules": {
    "@reatom/atom-rule": "error",
    "@reatom/action-rule": "error",
    "@reatom/reatom-prefix-rule": "error",
    "@reatom/atom-postfix-rule": "error"
  }
}
```

Here is an example of React + TypeScript + Prettier config with Reatom.

> [Eslint setup commit](https://github.com/artalar/reatom-react-ts/commit/3632b01d6a58a35602d1c191e5d6b53a7717e747)

```json
{
  "env": {
    "browser": true,
    "es2022": true
  },
  "extends": [
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "standard-with-typescript",
    "plugin:@reatom/recommended",
    "plugin:prettier/recommended"
  ],
  "overrides": [],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": ["tsconfig.json"]
  },
  "plugins": ["react", "@reatom", "prettier"],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "off",
    "prettier/prettier": "error"
  },
  "settings": {
    "atomPostfix": "Atom"
  }
}
```

## Motivation

 Many have asked why not make a Babel plugin for naming, why keep it in source? Our opinion on this has long been formed, keep it:

- Build tools are different, besides the outdated Babel there are a lot of other tools, and even written in different languages, it is difficult to support all of them;
- The result of the plugin's work is not visible and can lead to unpleasant debugging;
- The plugins and transpilation tools themselves often catch some bugs, partly due to the complexity of JavaScript as a language and partly due to the fragmentation of the ecosystem;
- It is difficult to cover all cases with a single transpilation, factories cause the most problems;
- The name contains a hash - redundant information when debugging;
- The hash is tied to the file and line - it easily changes with the slightest refactoring, causing the user cache to drop, this must be taken into account in automatic migrations (talking about the client persist state).

This list comes from real practice, for the first Reatom version (2019) there was a plugin and it was already clear that the game was not worth the candle, now the situation is even worse.

On the contrary, writing the name manually in the argument has a lot of advantages:

- Maximum visibility;
- Full control;
- Zero setup, not difficult, really not difficult, in terms of the amount and complexity of code required forces - nothing;
- AI tools, like Copilot, help a lot with the names;
- This ESLint plugin handles most cases perfectly.
