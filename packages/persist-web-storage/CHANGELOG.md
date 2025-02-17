# Changelog

## [3.4.4](https://github.com/artalar/reatom/compare/persist-web-storage-v3.4.3...persist-web-storage-v3.4.4) (2024-06-22)

### Bug Fixes

- **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.4.3](https://github.com/artalar/reatom/compare/persist-web-storage-v3.4.2...persist-web-storage-v3.4.3) (2024-06-22)

### Bug Fixes

- esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
- **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.4.2](https://github.com/artalar/reatom/compare/persist-web-storage-v3.4.1...persist-web-storage-v3.4.2) (2024-06-17)

### Bug Fixes

- **persist-web-storage:** missing export reatomPersistIndexedDb ([#876](https://github.com/artalar/reatom/issues/876)) ([e007b7f](https://github.com/artalar/reatom/commit/e007b7f11136b358e3f6452ecd9b3f7ffb73d48d))

## [3.4.1](https://github.com/artalar/reatom/compare/persist-web-storage-v3.4.0...persist-web-storage-v3.4.1) (2024-05-03)

### Bug Fixes

- **persist-web-storage:** fix cookie availability check ([#836](https://github.com/artalar/reatom/issues/836)) ([8da6fe3](https://github.com/artalar/reatom/commit/8da6fe364ff61403f4e6dd6239eb7923520d5143))

## [3.4.0](https://github.com/artalar/reatom/compare/persist-web-storage-v3.3.4...persist-web-storage-v3.4.0) (2024-05-01)

### Features

- **persist-web-storage:** add withCookie ([#830](https://github.com/artalar/reatom/issues/830)) ([25a865e](https://github.com/artalar/reatom/commit/25a865e58ca67ea230a5001a973132d3f76fc207))

## [3.3.4](https://github.com/artalar/reatom/compare/persist-web-storage-v3.3.3...persist-web-storage-v3.3.4) (2024-04-12)

### Bug Fixes

- **persist-web-storage:** availability of BroadcastChannel ([199d69a](https://github.com/artalar/reatom/commit/199d69a13a3b2b0eabc22bb5ffaaa8e025f40041))

## [3.3.3](https://github.com/artalar/reatom/compare/persist-web-storage-v3.3.2...persist-web-storage-v3.3.3) (2024-03-24)

### Bug Fixes

- **persist-web-storage:** isWebStorageAvailable check ([3e21b28](https://github.com/artalar/reatom/commit/3e21b28e061bea255235498e803239183eea4243))

## [3.3.2](https://github.com/artalar/reatom/compare/persist-web-storage-v3.3.1...persist-web-storage-v3.3.2) (2024-02-26)

### Bug Fixes

- **persist-web-storage:** indexedDB is not defined ([e5a527b](https://github.com/artalar/reatom/commit/e5a527b12c60dbea3383a32154a5cd2352849ce1))

## [3.3.1](https://github.com/artalar/reatom/compare/persist-web-storage-v3.3.0...persist-web-storage-v3.3.1) (2024-02-20)

### Bug Fixes

- **persist-web-storage:** types ([ab0e826](https://github.com/artalar/reatom/commit/ab0e8261f39d81998bccc6425f3dee577143da7c))

## [3.3.0](https://github.com/artalar/reatom/compare/persist-web-storage-v3.2.3...persist-web-storage-v3.3.0) (2024-02-05)

### Features

- **persist-web-storage:** add withBroadcastChannel and withIndexedDb ([#740](https://github.com/artalar/reatom/issues/740)) ([fe74b4a](https://github.com/artalar/reatom/commit/fe74b4ab4e0007cb7ae417f156ef65e4d0b4ce42))

### Bug Fixes

- **persist-web-storage:** fix getting initialState for BroadcastChannel and IDB adapters ([#755](https://github.com/artalar/reatom/issues/755)) ([5302c57](https://github.com/artalar/reatom/commit/5302c575a0bb3c27d1d7935961db362b0d651f2d))
- **persist-web-storage:** init logic, types ([6921517](https://github.com/artalar/reatom/commit/69215171b55107549a886fc05cc983a091ee2bcc))
- **persist-web-storage:** memCache management ([72d6f89](https://github.com/artalar/reatom/commit/72d6f898244ae7818a3b7b0b01043beb851094df))

## [3.2.3](https://github.com/artalar/reatom/compare/persist-web-storage-v3.2.2...persist-web-storage-v3.2.3) (2023-07-12)

### Bug Fixes

- **persist-web-storage:** wrap memCache to atom ([c8ebba7](https://github.com/artalar/reatom/commit/c8ebba732ea613b01112f0abd51334299ed05f15))

## [3.2.2](https://github.com/artalar/reatom/compare/persist-web-storage-v3.2.1...persist-web-storage-v3.2.2) (2023-07-07)

### Bug Fixes

- **persist-web-storage:** rm `fromState` work ([106fdca](https://github.com/artalar/reatom/commit/106fdca81fd1644d374ae70755cbcfbcbafd2583))

## [3.2.1](https://github.com/artalar/reatom/compare/persist-web-storage-v3.2.0...persist-web-storage-v3.2.1) (2023-05-21)

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

## [3.2.0](https://github.com/artalar/reatom/compare/persist-web-storage-v3.1.0...persist-web-storage-v3.2.0) (2023-05-10)

### Features

- **persist-web-storage:** create (rewritten from scratch) ([1479a92](https://github.com/artalar/reatom/commit/1479a92b0dc8af716ab39f04422c990e92a8bc85))
