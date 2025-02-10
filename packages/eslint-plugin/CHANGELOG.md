# Changelog

## [3.8.0](https://github.com/artalar/reatom/compare/eslint-plugin-v3.7.1...eslint-plugin-v3.8.0) (2025-02-05)


### Features

* **eslint-plugin:** schedule-import-rule ([#930](https://github.com/artalar/reatom/issues/930)) ([89d63d0](https://github.com/artalar/reatom/commit/89d63d06dd4018ef6aeed8db6daf6928f3ffd24a))


### Bug Fixes

* **eslint-plugin:** false-negative for `name` as prop and invalid derivation for objects inside a named factory ([#1021](https://github.com/artalar/reatom/issues/1021)) ([6b15f13](https://github.com/artalar/reatom/commit/6b15f131682d88373e6a0f9f1bb75af60a989d8a))
* **eslint-plugin:** fix eslint build [#1027](https://github.com/artalar/reatom/issues/1027) ([#1030](https://github.com/artalar/reatom/issues/1030)) ([8dd2669](https://github.com/artalar/reatom/commit/8dd266971ed1c81938eda91fe4f7b8bf5cc10762))

## [3.7.1](https://github.com/artalar/reatom/compare/eslint-plugin-v3.7.0...eslint-plugin-v3.7.1) (2024-11-07)


### Bug Fixes

* **eslint-plugin:** typeError in reatom/unit-naming-rule ([#968](https://github.com/artalar/reatom/issues/968)) ([8392593](https://github.com/artalar/reatom/commit/8392593d6caab3136acbe1e77cb28129630d41e4))

## [3.7.0](https://github.com/artalar/reatom/compare/eslint-plugin-v3.6.2...eslint-plugin-v3.7.0) (2024-09-12)


### Features

* **eslint-plugin:** complete unit-naming-rule ([#523](https://github.com/artalar/reatom/issues/523)) ([#920](https://github.com/artalar/reatom/issues/920)) ([590ebbf](https://github.com/artalar/reatom/commit/590ebbf4fe14c649304b77b7815766779c19a078))

## [3.6.2](https://github.com/artalar/reatom/compare/eslint-plugin-v3.6.1...eslint-plugin-v3.6.2) (2024-06-22)


### Bug Fixes

* **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.6.1](https://github.com/artalar/reatom/compare/eslint-plugin-v3.6.0...eslint-plugin-v3.6.1) (2024-06-22)


### Bug Fixes

* esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
* **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.6.0](https://github.com/artalar/reatom/compare/eslint-plugin-v3.5.0...eslint-plugin-v3.6.0) (2024-02-16)


### Features

* **eslint-plugin:** enforce domain in names ([#764](https://github.com/artalar/reatom/issues/764)) ([0b4ccff](https://github.com/artalar/reatom/commit/0b4ccffa80fa738233f2160fc9b3a70269c6d4d5))

## [3.5.0](https://github.com/artalar/reatom/compare/eslint-plugin-v3.4.3...eslint-plugin-v3.5.0) (2024-02-05)


### Features

* **eslint-plugin:** add async-rule & unit-naming-rule ([#709](https://github.com/artalar/reatom/issues/709)) ([04de10c](https://github.com/artalar/reatom/commit/04de10cb9bd3d39d2deec3ed1a5e0aface9de3c9))

## [3.4.3](https://github.com/artalar/reatom/compare/eslint-plugin-v3.4.2...eslint-plugin-v3.4.3) (2023-10-20)


### Bug Fixes

* **lens:** match default case ([27061af](https://github.com/artalar/reatom/commit/27061af1ac338f5223190d110cf6e090d884e203))

## [3.4.2](https://github.com/artalar/reatom/compare/eslint-plugin-v3.4.1...eslint-plugin-v3.4.2) (2023-10-10)


### Bug Fixes

* **eslint-plugin:** allow any template literal ([#661](https://github.com/artalar/reatom/issues/661)) ([5539cdd](https://github.com/artalar/reatom/commit/5539cddb5628de56f7e7f011c41ec4230d7a4ae5))
* **eslint-plugin:** allow explicit empty atomPostfix ([7bac17f](https://github.com/artalar/reatom/commit/7bac17f83350349b8e428688a1aceb16cfefbe11))

## [3.4.1](https://github.com/artalar/reatom/compare/eslint-plugin-v3.4.0...eslint-plugin-v3.4.1) (2023-09-13)


### Bug Fixes

* **esling-plugin:** highlight atom name, not atom declaration in case of wrong name ([#624](https://github.com/artalar/reatom/issues/624)) ([39b0d01](https://github.com/artalar/reatom/commit/39b0d015b6de6a5cfa83da17871bbcb52e101994))

## [3.4.0](https://github.com/artalar/reatom/compare/eslint-plugin-v3.3.0...eslint-plugin-v3.4.0) (2023-05-21)


### Features

* **eslint-plugin:** postfix atom rule ([#552](https://github.com/artalar/reatom/issues/552)) ([80c8710](https://github.com/artalar/reatom/commit/80c8710e3710b6c6696a0540e65dd90a44112343))


### Bug Fixes

* **eslint-plugin:** [#541](https://github.com/artalar/reatom/issues/541) not fired inside the object ([#546](https://github.com/artalar/reatom/issues/546)) ([e6c6778](https://github.com/artalar/reatom/commit/e6c677860697e020d7715426484c8348d1552342))
* **eslint-plugin:** the detection of uncorrect name when importing through aliases ([#538](https://github.com/artalar/reatom/issues/538)) ([c23d920](https://github.com/artalar/reatom/commit/c23d920c8efe80e80fc3a66fdd1f626f7a0c180b))
* new way of hooking up typings [#560](https://github.com/artalar/reatom/issues/560) ([#568](https://github.com/artalar/reatom/issues/568)) ([99550e9](https://github.com/artalar/reatom/commit/99550e98c34df7efd8431282a868a0483bed5dc8))

## [3.3.0](https://github.com/artalar/reatom/compare/eslint-plugin-v3.1.3...eslint-plugin-v3.2.0) (2023-05-10)


### Features

* **eslint-plugin:** postfix atom rule ([#552](https://github.com/artalar/reatom/issues/552)) ([80c8710](https://github.com/artalar/reatom/commit/80c8710e3710b6c6696a0540e65dd90a44112343))

## [3.1.3](https://github.com/artalar/reatom/compare/eslint-plugin-v3.1.2...eslint-plugin-v3.1.3) (2023-04-18)


### Bug Fixes

* **eslint-plugin:** [#541](https://github.com/artalar/reatom/issues/541) not fired inside the object ([#546](https://github.com/artalar/reatom/issues/546)) ([e6c6778](https://github.com/artalar/reatom/commit/e6c677860697e020d7715426484c8348d1552342))
* **eslint-plugin:** the detection of uncorrect name when importing through aliases ([#538](https://github.com/artalar/reatom/issues/538)) ([c23d920](https://github.com/artalar/reatom/commit/c23d920c8efe80e80fc3a66fdd1f626f7a0c180b))

## [3.1.1](https://github.com/artalar/reatom/compare/eslint-plugin-v3.1.0...eslint-plugin-v3.1.1) (2023-04-10)


### Bug Fixes

* **eslint-plugin:** the detection of uncorrect name when importing through aliases ([#538](https://github.com/artalar/reatom/issues/538)) ([c23d920](https://github.com/artalar/reatom/commit/c23d920c8efe80e80fc3a66fdd1f626f7a0c180b))
