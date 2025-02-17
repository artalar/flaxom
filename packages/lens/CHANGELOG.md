# Changelog

## [3.11.6](https://github.com/artalar/reatom/compare/lens-v3.11.5...lens-v3.11.6) (2024-12-11)

### Bug Fixes

- **lens:** parseAtoms types ([e284d32](https://github.com/artalar/reatom/commit/e284d32158caf7233ca36670c345ed4626fec1d9))

## [3.11.5](https://github.com/artalar/reatom/compare/lens-v3.11.4...lens-v3.11.5) (2024-11-14)

### Bug Fixes

- **lens:** reactive match ([#973](https://github.com/artalar/reatom/issues/973)) ([659b78d](https://github.com/artalar/reatom/commit/659b78dbe650a2e6747e8f1918210054cf369940))

## [3.11.4](https://github.com/artalar/reatom/compare/lens-v3.11.3...lens-v3.11.4) (2024-09-06)

### Bug Fixes

- **lens:** better matched expression type ([#914](https://github.com/artalar/reatom/issues/914)) ([2ea51cd](https://github.com/artalar/reatom/commit/2ea51cd509760fa8ecb6530dc51c602a93e08a13))

## [3.11.3](https://github.com/artalar/reatom/compare/lens-v3.11.2...lens-v3.11.3) (2024-08-24)

### Bug Fixes

- **lens:** select equal callback ([ce87fbf](https://github.com/artalar/reatom/commit/ce87fbfd0e7ef953e6c5156645c0aac77b20a952))

## [3.11.2](https://github.com/artalar/reatom/compare/lens-v3.11.1...lens-v3.11.2) (2024-06-22)

### Bug Fixes

- **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.11.1](https://github.com/artalar/reatom/compare/lens-v3.11.0...lens-v3.11.1) (2024-06-22)

### Bug Fixes

- esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
- **lens:** match ctx instead of cause in select ([3f1fd8e](https://github.com/artalar/reatom/commit/3f1fd8e21d457cc9f78d2a71ef9f8caa585fcf99))
- **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.11.0](https://github.com/artalar/reatom/compare/lens-v3.10.0...lens-v3.11.0) (2024-06-12)

### Features

- **lens:** support linked list in parseAtoms ([534d745](https://github.com/artalar/reatom/commit/534d74583af3890fe9ac18baf08b11c25dd1f957))

### Bug Fixes

- **lens:** do not perform actions in parseAtoms ([cff48d0](https://github.com/artalar/reatom/commit/cff48d060ae2a6a0afab4612353bac1926f39c21))

## [3.10.0](https://github.com/artalar/reatom/compare/lens-v3.9.1...lens-v3.10.0) (2024-05-25)

### Features

- **lens:** allow to call select multiple times ([6ea0223](https://github.com/artalar/reatom/commit/6ea022382ace846f5bb15abdf41bc35783764555))

## [3.9.1](https://github.com/artalar/reatom/compare/lens-v3.9.0...lens-v3.9.1) (2023-11-25)

### Bug Fixes

- **lens:** select export ([fd776cf](https://github.com/artalar/reatom/commit/fd776cf6a5ca36beb9e3581315abb8afe7ca2050))

## [3.9.0](https://github.com/artalar/reatom/compare/lens-v3.8.0...lens-v3.9.0) (2023-11-23)

### Features

- **lens:** add select api ([f39f1dd](https://github.com/artalar/reatom/commit/f39f1dd5434462f8466c892342dd8b6c29d70162))

## [3.8.0](https://github.com/artalar/reatom/compare/lens-v3.7.0...lens-v3.8.0) (2023-10-20)

### Features

- **lens:** add match().with ([f61dddc](https://github.com/artalar/reatom/commit/f61dddc858fda9921117acd472cc4e4e71cdd47e))
- **utils:** add isRec ([444c4f6](https://github.com/artalar/reatom/commit/444c4f6c528092a59bdd332218b3d42c88351999))

### Bug Fixes

- **lens:** dont allow non-recs as match.with input ([#675](https://github.com/artalar/reatom/issues/675)) ([3c6e8bc](https://github.com/artalar/reatom/commit/3c6e8bc1425cb0c5a6fbde4d78f81c1ab15c7cf9))
- **lens:** match default case ([27061af](https://github.com/artalar/reatom/commit/27061af1ac338f5223190d110cf6e090d884e203))

## [3.7.0](https://github.com/artalar/reatom/compare/lens-v3.6.2...lens-v3.7.0) (2023-10-09)

### Features

- **jsx:** nested atoms, better types ([#652](https://github.com/artalar/reatom/issues/652)) ([3ceae78](https://github.com/artalar/reatom/commit/3ceae788da52ff40a561ce5b2fc5371475fb7d7c))
- **lens:** add match ([#646](https://github.com/artalar/reatom/issues/646)) ([0f2a768](https://github.com/artalar/reatom/commit/0f2a7685dd797cac4c9fc882a8e24bc31f9503a6))
- **match:** api redesign (it isn't published yet) ([0e9554e](https://github.com/artalar/reatom/commit/0e9554e8e493b70912f6efd23c69731cfa60ebb8))
- **match:** remove equal method ([c1d077c](https://github.com/artalar/reatom/commit/c1d077c99944116a301f0cc0c24aade6a27e7351))

## [3.6.2](https://github.com/artalar/reatom/compare/lens-v3.6.1...lens-v3.6.2) (2023-09-13)

### Bug Fixes

- **lens:** remove spy from effect ([ece3c86](https://github.com/artalar/reatom/commit/ece3c8662a1fe69e8dc897b8ff252feb57cd5273))

## [3.6.1](https://github.com/artalar/reatom/compare/lens-v3.6.0...lens-v3.6.1) (2023-08-10)

### Bug Fixes

- **lens:** mapName usage ([8865ce0](https://github.com/artalar/reatom/commit/8865ce0654bf468e560ef3f238611f5168db5925))

## [3.6.0](https://github.com/artalar/reatom/compare/lens-v3.5.1...lens-v3.6.0) (2023-06-12)

### Features

- **lens:** add abortable option to delay ([d532f1c](https://github.com/artalar/reatom/commit/d532f1c0c3f207827136cd5804d57aa337e4665d))
- **lens:** use onChange and onCall in "plain" and "readonly" ([fb50938](https://github.com/artalar/reatom/commit/fb50938aba30ffefb99f570b894a58df489d2d44))

## [3.5.1](https://github.com/artalar/reatom/compare/lens-v3.5.0...lens-v3.5.1) (2023-05-21)

### Bug Fixes

- **all-settled:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **async:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **core-v1:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **core-v2:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **core:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **effects:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **eslint-plugin:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **form-web:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **form:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **framework:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **hooks:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **lens:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **logger:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **navigation:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- new way of hooking up typings [#560](https://github.com/artalar/reatom/issues/560) ([#568](https://github.com/artalar/reatom/issues/568)) ([99550e9](https://github.com/artalar/reatom/commit/99550e98c34df7efd8431282a868a0483bed5dc8))
- **npm-cookie-baker:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **npm-history:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **npm-lit:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **npm-react:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **npm-svelte:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **persist-web-storage:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **persist:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **primitives:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **react-v1:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **react-v2:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **testing:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **timer:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **undo:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
- **utils:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))

## [3.5.0](https://github.com/artalar/reatom/compare/lens-v3.4.0...lens-v3.5.0) (2023-05-10)

### Features

- **lens:** make parseAtoms reactive ([5fc55f9](https://github.com/artalar/reatom/commit/5fc55f956ab010118dbbae5354fc53d5c5c72236))
- **lens:** map function for toAction ([691801d](https://github.com/artalar/reatom/commit/691801d675bb9d62b15e46b923cd12f19ebb4de6))

### Bug Fixes

- **lens:** add DelayOptions interface ([535c406](https://github.com/artalar/reatom/commit/535c40685a03655c074f8e165c38e9f097bf06db))

## [3.4.0](https://github.com/artalar/reatom/compare/lens-v3.3.3...lens-v3.4.0) (2023-04-18)

### Features

- **lens:** add new operators and onLensUpdate ([#533](https://github.com/artalar/reatom/issues/533)) ([2442ca3](https://github.com/artalar/reatom/commit/2442ca34b6ab1fdc0c0aff52d18e85999e6de607))

### Bug Fixes

- **lens:** add LensEffect ([c304f4d](https://github.com/artalar/reatom/commit/c304f4d5a6d5230a906fdad3891043c5f1543a63))
- **lens:** mapPayload 4 arg state ([0f527ed](https://github.com/artalar/reatom/commit/0f527ed66a9b1f7d622f17fa77d995652edfe7d7))
- **lens:** use onUpdate ([230a9c9](https://github.com/artalar/reatom/commit/230a9c9f920273d16eae67344acc309ad583f068))

## [3.3.0](https://github.com/artalar/reatom/compare/lens-v3.2.0...lens-v3.3.0) (2023-04-10)

**feat(lens): new operators for onLensUpdate**

Add onDeepUpdate to handle updates from the whole chain.

add new operators: combine, effect, withOnUpdate, toAction.

Refactor existed operators to add "deps" property with a list of dependencies.

**feat(lens): add general delay operator**

made limits optional atoms (for debounce too) add throttle, add tests

separate operators to different files

change return type of all operators to LensAtom / LensAction

**docs(lens): add small peace of docs**

**feat(lens): rename onDeepUpdate to onLensUpdate**

add toLens
