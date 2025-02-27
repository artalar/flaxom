# Changelog

## [3.11.3](https://github.com/artalar/reatom/compare/effects-v3.11.2...effects-v3.11.3) (2025-02-27)


### Bug Fixes

* **effects:** abort message format ([41c8b77](https://github.com/artalar/reatom/commit/41c8b770a10e265ef9cbc24e953fd5f728ff1996))

## [3.11.2](https://github.com/artalar/reatom/compare/effects-v3.11.1...effects-v3.11.2) (2025-02-10)

### Bug Fixes

- **effects:** concurrent recursion ([0ced206](https://github.com/artalar/reatom/commit/0ced206e450de0830c138c055da00cad99d0b851))

## [3.11.1](https://github.com/artalar/reatom/compare/effects-v3.11.0...effects-v3.11.1) (2025-01-14)

### Bug Fixes

- **effects:** concurrent abort [#1003](https://github.com/artalar/reatom/issues/1003) ([469b0d4](https://github.com/artalar/reatom/commit/469b0d44193b09953721db9072bc75e29b42a4c8))

## [3.11.0](https://github.com/artalar/reatom/compare/effects-v3.10.2...effects-v3.11.0) (2024-12-30)

### Features

- **effects:** add optional logging for the take [#987](https://github.com/artalar/reatom/issues/987) ([c57b83a](https://github.com/artalar/reatom/commit/c57b83a15d704ac715562cb2b143d6d908c9af41))

## [3.10.2](https://github.com/artalar/reatom/compare/effects-v3.10.1...effects-v3.10.2) (2024-12-11)

### Bug Fixes

- **effects:** unable to specify CtxSpy for concurrent ([#981](https://github.com/artalar/reatom/issues/981)) ([01af2b6](https://github.com/artalar/reatom/commit/01af2b615b4c4c3f9ba231764c2630acfde66fa5))

## [3.10.1](https://github.com/artalar/reatom/compare/effects-v3.10.0...effects-v3.10.1) (2024-10-31)

### Bug Fixes

- **effects:** small refactoring ([0bc0f0b](https://github.com/artalar/reatom/commit/0bc0f0b2cf2a1b6593019a2f8ef175f15bc81284))

## [3.10.0](https://github.com/artalar/reatom/compare/effects-v3.9.0...effects-v3.10.0) (2024-10-08)

### Features

- **effects:** explicit spawn action ([578186b](https://github.com/artalar/reatom/commit/578186b544723ed64ff1294d558d5162d463d4b9))

## [3.9.0](https://github.com/artalar/reatom/compare/effects-v3.8.3...effects-v3.9.0) (2024-09-06)

### Features

- **effects:** concurrent strategies ([426aedc](https://github.com/artalar/reatom/commit/426aedcefb1b22bda21433a3dd04cb235d49af9d))

### Bug Fixes

- **effects:** concurrent ctx types ([799485f](https://github.com/artalar/reatom/commit/799485fcf4aa9096b504cc52426cec74424e0515))

## [3.8.3](https://github.com/artalar/reatom/compare/effects-v3.8.2...effects-v3.8.3) (2024-07-16)

### Bug Fixes

- **effects:** concurrent outdated abort handling ([23f177e](https://github.com/artalar/reatom/commit/23f177e804546a8d43530a4c0dc764c162737513))

## [3.8.2](https://github.com/artalar/reatom/compare/effects-v3.8.1...effects-v3.8.2) (2024-06-22)

### Bug Fixes

- **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.8.1](https://github.com/artalar/reatom/compare/effects-v3.8.0...effects-v3.8.1) (2024-06-22)

### Bug Fixes

- esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
- **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.8.0](https://github.com/artalar/reatom/compare/effects-v3.7.3...effects-v3.8.0) (2024-06-04)

### Features

- **effects:** add reaction API ([4c9d589](https://github.com/artalar/reatom/commit/4c9d5892f733e04e575937133eca3ec51424759f))

### Bug Fixes

- **effects:** allow to use "concurrent" with CtxSpy ([4da1ab0](https://github.com/artalar/reatom/commit/4da1ab04ecbd1de66d783c2bad2da6671981905a))

## [3.7.3](https://github.com/artalar/reatom/compare/effects-v3.7.2...effects-v3.7.3) (2024-05-03)

### Bug Fixes

- **effects:** missed abort... ([66d2afd](https://github.com/artalar/reatom/commit/66d2afd9bb6cfc1ababdffb7b547b7cee3e9425b))

## [3.7.2](https://github.com/artalar/reatom/compare/effects-v3.7.1...effects-v3.7.2) (2023-11-25)

### Bug Fixes

- **effects:** more friendly typings for isCausedBy ([5d60c1d](https://github.com/artalar/reatom/commit/5d60c1da8710c90df60b24e5d013e829455260d0))
- **effects:** prevent unhandled error for abort ([fe884e2](https://github.com/artalar/reatom/commit/fe884e24ac574fc50c7ce4e825459d7059136b73))

## [3.7.1](https://github.com/artalar/reatom/compare/effects-v3.7.0...effects-v3.7.1) (2023-11-23)

### Bug Fixes

- **effects:** concurrent.abortControllerAtom name ([25bdc47](https://github.com/artalar/reatom/commit/25bdc479e62045f946aeee6b9e001a8cb3450a07))
- **effects:** prevent uncaught rejection for the abort of the concurrent API ([028bf10](https://github.com/artalar/reatom/commit/028bf10baa38bcd85d6ae7445c8294160b50ca07))

## [3.7.0](https://github.com/artalar/reatom/compare/effects-v3.6.0...effects-v3.7.0) (2023-11-20)

### Features

- **effects:** add abortCauseContext ([af28718](https://github.com/artalar/reatom/commit/af28718598a852ba7926e54cd5f1b6a508441951))
- **effects:** add concurrent ([21b824b](https://github.com/artalar/reatom/commit/21b824b939bd6bd57b3d33d8eaa91ea67d784c41))
- **effects:** add spawn ([2eab5cb](https://github.com/artalar/reatom/commit/2eab5cbc6b26450b09ed43ad9cb815a997950c1d))

### Bug Fixes

- **effects:** concurrent nested aborts ([6cc5dc4](https://github.com/artalar/reatom/commit/6cc5dc45c8f6bb9e51c2fd76c7b6dda7352ce4c2))

## [3.6.0](https://github.com/artalar/reatom/compare/effects-v3.5.1...effects-v3.6.0) (2023-10-20)

### Features

- **effects:** add isInit method ([4a8aeb1](https://github.com/artalar/reatom/commit/4a8aeb14d0cdf54a545dda498c026e8f9b7c29d2))
- **effects:** skip mark for take filter ([c136bd8](https://github.com/artalar/reatom/commit/c136bd884df59715ea8a4028e29eaa3e1dc6b076))

### Bug Fixes

- **effects:** withAbortableSchedule ([399d36f](https://github.com/artalar/reatom/commit/399d36ffb00d3597fa9c234358b8c50a6aeb8a7a))

## [3.5.1](https://github.com/artalar/reatom/compare/effects-v3.5.0...effects-v3.5.1) (2023-09-14)

### Bug Fixes

- **effects:** withAbortableSchedule sync abort ([ebede8d](https://github.com/artalar/reatom/commit/ebede8d8f652da58bf2e29d6b5ec58966199059b))

## [3.5.0](https://github.com/artalar/reatom/compare/effects-v3.4.0...effects-v3.5.0) (2023-09-13)

### Features

- **effects:** add withAbortableSchedule ([9e219a7](https://github.com/artalar/reatom/commit/9e219a7d61c18cc15bcff28f310938166d10de2c))

### Bug Fixes

- **effects:** prevent Uncaught DOMException for aborts ([79f719b](https://github.com/artalar/reatom/commit/79f719bbdd6e97cb56c3399a841c33764822d598))

## [3.4.0](https://github.com/artalar/reatom/compare/effects-v3.3.1...effects-v3.4.0) (2023-08-05)

### Features

- **effects:** add CauseContext ([65baab5](https://github.com/artalar/reatom/commit/65baab5cdc1256619b1fa779376f3e7508fc0c8d))
- **effects:** add isCausedBy ([02a6406](https://github.com/artalar/reatom/commit/02a64069e272387cb64b1573a765a3d70abac825))

### Bug Fixes

- **effects:** add has method to CauseContext ([0b442c1](https://github.com/artalar/reatom/commit/0b442c1fdbb119c2828951aff0b97d490efdb397))

## [3.3.1](https://github.com/artalar/reatom/compare/effects-v3.3.0...effects-v3.3.1) (2023-07-07)

### Bug Fixes

- **effects:** \_\_thenReatomed error propagation ([6a7536f](https://github.com/artalar/reatom/commit/6a7536f7b5afcad22fc90fc0afbfc7b71bfd71ec))
- **effects:** improve onCtxAbort ([16ee497](https://github.com/artalar/reatom/commit/16ee497b08810aef908bcd7b2b2e7151d5f4ff12))

## [3.3.0](https://github.com/artalar/reatom/compare/effects-v3.2.1...effects-v3.3.0) (2023-06-12)

### Features

- **effects:** change the behavior of \_\_thenReatomed ([6a7ccba](https://github.com/artalar/reatom/commit/6a7ccba6a46521807d5d1e5eef3c3ad219454779))

### Bug Fixes

- **effects:** onCtxAbort for sync and async usage ([bc52760](https://github.com/artalar/reatom/commit/bc52760aa54d767744ba07ce17124d1f48f0a4ee))

## [3.2.1](https://github.com/artalar/reatom/compare/effects-v3.2.0...effects-v3.2.1) (2023-05-21)

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
