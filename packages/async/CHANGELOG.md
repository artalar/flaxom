# Changelog

## [3.16.6](https://github.com/artalar/reatom/compare/async-v3.16.5...async-v3.16.6) (2025-02-10)


### Bug Fixes

* **async:** reatomResource recursion ([6d45161](https://github.com/artalar/reatom/commit/6d45161bfd271f9b75332da4d1eda9fa8a00adab))

## [3.16.5](https://github.com/artalar/reatom/compare/async-v3.16.4...async-v3.16.5) (2025-01-14)


### Bug Fixes

* **effects:** concurrent abort [#1003](https://github.com/artalar/reatom/issues/1003) ([469b0d4](https://github.com/artalar/reatom/commit/469b0d44193b09953721db9072bc75e29b42a4c8))

## [3.16.4](https://github.com/artalar/reatom/compare/async-v3.16.3...async-v3.16.4) (2024-12-11)


### Bug Fixes

* **async:** status AsyncStatusesAbortedPending [#985](https://github.com/artalar/reatom/issues/985) ([85e60ef](https://github.com/artalar/reatom/commit/85e60efcd8e64df6476ee5ad13d15454307bd439))

## [3.16.3](https://github.com/artalar/reatom/compare/async-v3.16.2...async-v3.16.3) (2024-10-31)


### Bug Fixes

* **async:** invalidation for resource cache ([8de89a3](https://github.com/artalar/reatom/commit/8de89a382ec47de005b74a0ca211877befce9250))
* **async:** retry concurrency ([6a43188](https://github.com/artalar/reatom/commit/6a4318899354267d7b37b378fcf8a912cf6c7292))

## [3.16.2](https://github.com/artalar/reatom/compare/async-v3.16.1...async-v3.16.2) (2024-10-08)


### Bug Fixes

* **async:** cache cause handling ([be96aa1](https://github.com/artalar/reatom/commit/be96aa1c64f5596163537bd5c8524f8cb9674490))

## [3.16.1](https://github.com/artalar/reatom/compare/async-v3.16.0...async-v3.16.1) (2024-09-06)


### Bug Fixes

* **async:** ignore abort in resource if a subscribers exists ([67bfdad](https://github.com/artalar/reatom/commit/67bfdad05ddc7852bb781f811a39107296662154))

## [3.16.0](https://github.com/artalar/reatom/compare/async-v3.15.3...async-v3.16.0) (2024-09-06)


### Features

* **async:** reset for resource ([852ba1e](https://github.com/artalar/reatom/commit/852ba1e3a327ce7114f7c6f4cb13ae233e82a05b))

## [3.15.3](https://github.com/artalar/reatom/compare/async-v3.15.2...async-v3.15.3) (2024-08-19)


### Bug Fixes

* **async:** first-in-win pending ([15c6d75](https://github.com/artalar/reatom/commit/15c6d75d57d8d25a623181e38ac4812bf1cd3d24))
* **async:** use setTimeout with toJSON ([8c2ed7b](https://github.com/artalar/reatom/commit/8c2ed7b2f5f52da6fbc1993b1253043928961f1d))
* **async:** withAbort strategy first-in-win ([#898](https://github.com/artalar/reatom/issues/898)) ([0875cbb](https://github.com/artalar/reatom/commit/0875cbb79d64551d09051bbc6e39c41ef4b4af85))

## [3.15.2](https://github.com/artalar/reatom/compare/async-v3.15.1...async-v3.15.2) (2024-06-22)


### Bug Fixes

* **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.15.1](https://github.com/artalar/reatom/compare/async-v3.15.0...async-v3.15.1) (2024-06-22)


### Bug Fixes

* esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
* **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.15.0](https://github.com/artalar/reatom/compare/async-v3.14.2...async-v3.15.0) (2024-05-25)


### Features

* **async:** add to cache setWithParams and deleteWithParams [#796](https://github.com/artalar/reatom/issues/796) ([b53fe98](https://github.com/artalar/reatom/commit/b53fe98b37e178735240b274336c29de6e3be1c5))

## [3.14.2](https://github.com/artalar/reatom/compare/async-v3.14.1...async-v3.14.2) (2024-05-03)


### Bug Fixes

* **async:** add AsyncStatusesAbortedSettle ([bd03669](https://github.com/artalar/reatom/commit/bd03669bfa1814e1ce4cd28387c8de70a5d0b4d7))

## [3.14.1](https://github.com/artalar/reatom/compare/async-v3.14.0...async-v3.14.1) (2024-04-28)


### Bug Fixes

* **async:** add AsyncStatusesFirstAborted and AsyncStatusesAbortedPending ([f653bb2](https://github.com/artalar/reatom/commit/f653bb2cd2a07eef9c062aa9477de91b06716e69))

## [3.14.0](https://github.com/artalar/reatom/compare/async-v3.13.6...async-v3.14.0) (2024-04-12)


### Features

* **primitives:** add withAssign, deprecate withReducers ([3ac66fc](https://github.com/artalar/reatom/commit/3ac66fc76fffa4ef05e9782d93c982020188196f))


### Bug Fixes

* **async:** change type of dataAtom in withDataAtom operator without initState ([#785](https://github.com/artalar/reatom/issues/785)) ([ecf44a6](https://github.com/artalar/reatom/commit/ecf44a6039e3217cb2d45c465564a67bd21f095c))

## [3.13.6](https://github.com/artalar/reatom/compare/async-v3.13.5...async-v3.13.6) (2024-03-19)


### Bug Fixes

* **async:** drop retriesAtom if onReject returns undefined ([77e71b3](https://github.com/artalar/reatom/commit/77e71b3cafe79732a5611d4983778ed90d95f69e))

## [3.13.5](https://github.com/artalar/reatom/compare/async-v3.13.4...async-v3.13.5) (2024-03-06)


### Bug Fixes

* **async:** withAbort + reatomResource ([47d81f7](https://github.com/artalar/reatom/commit/47d81f7aed563720692c4ecbf627d701e4cafe29))

## [3.13.4](https://github.com/artalar/reatom/compare/async-v3.13.3...async-v3.13.4) (2024-01-21)


### Bug Fixes

* **async:** prevent ERR_UNHANDLED_REJECTION if the onReject has any handlers ([c66ad56](https://github.com/artalar/reatom/commit/c66ad56e9b4cd536fda93e9cf0cc4a4b862abf91))

## [3.13.3](https://github.com/artalar/reatom/compare/async-v3.13.2...async-v3.13.3) (2023-11-25)


### Bug Fixes

* **async:** prevent unhandled error for abort ([8c64522](https://github.com/artalar/reatom/commit/8c64522bed4d13b35a9f7f354ef6b086b5fbda98))

## [3.13.2](https://github.com/artalar/reatom/compare/async-v3.13.1...async-v3.13.2) (2023-11-23)


### Bug Fixes

* **async:** reatomResource: do not drop the cache of an error ([75f54e6](https://github.com/artalar/reatom/commit/75f54e6fe8ab5a46d20846656d908c0779551e81))

## [3.13.1](https://github.com/artalar/reatom/compare/async-v3.13.0...async-v3.13.1) (2023-11-20)


### Bug Fixes

* **async:** allow optional resetTrigger for withErrorAtom ([185f99d](https://github.com/artalar/reatom/commit/185f99db81541ad72c18b5360517a89a08386807))
* **async:** more mem safety for abortCauseContext ([aa5e29f](https://github.com/artalar/reatom/commit/aa5e29f17d250a20a10476cb2054897feda43628))
* **async:** use abortCauseContext ([6133f27](https://github.com/artalar/reatom/commit/6133f275d4cb3529fd744558324e38a621cb66a4))

## [3.13.0](https://github.com/artalar/reatom/compare/async-v3.12.1...async-v3.13.0) (2023-11-12)


### Features

* **async:** add initState to errorAtom ([6852b72](https://github.com/artalar/reatom/commit/6852b7291ccc4fb6acfb9ecfb48d3c2326fa78ee))


### Bug Fixes

* **async:** activate resource on pending connection ([81f19b9](https://github.com/artalar/reatom/commit/81f19b996c0a2535b2c9056dd4197f447620604f))
* **async:** dataAtom should be computed first ([8aab299](https://github.com/artalar/reatom/commit/8aab299916f35afc0cb89983c58eeb4ae5b237cb))
* **async:** withErrorAtom should be computed first ([0c458da](https://github.com/artalar/reatom/commit/0c458da9f1eaf6a3226ca2e57f8ba5360dc7ce9e))
* **async:** withRetry races ([0abe299](https://github.com/artalar/reatom/commit/0abe29976c319525544efd5fd659e004b76d6edf))

## [3.12.1](https://github.com/artalar/reatom/compare/async-v3.12.0...async-v3.12.1) (2023-11-07)


### Bug Fixes

* **async:** errorAtom: AtomMut ([a1349a8](https://github.com/artalar/reatom/commit/a1349a8118366a75d4cb9bf40d6e94274a2a87f2))

## [3.12.0](https://github.com/artalar/reatom/compare/async-v3.11.0...async-v3.12.0) (2023-11-05)


### Features

* **async:** add shouldPending and swrPendingAtom ([103e30c](https://github.com/artalar/reatom/commit/103e30c7aa8bd7879da347d2653389a39221d952))


### Bug Fixes

* **async:** reatomResource small mem leak ([408d916](https://github.com/artalar/reatom/commit/408d9167712cf53dc4381caee3c08f353752d990))

## [3.11.0](https://github.com/artalar/reatom/compare/async-v3.10.1...async-v3.11.0) (2023-10-31)


### Features

* **async:** add reset action to statusesAtom ([7803168](https://github.com/artalar/reatom/commit/78031689792d7737641fc822324dbe482c4a8fec))


### Bug Fixes

* **async:** improve withStatusesAtom update order ([316bac5](https://github.com/artalar/reatom/commit/316bac55d18cdd24c743e3e6e6eb5645b2ebf5c6))
* **async:** withAbort + withRetry ([d5190ab](https://github.com/artalar/reatom/commit/d5190ab87d57e3925652e07c0741c2938b80cd39))

## [3.10.1](https://github.com/artalar/reatom/compare/async-v3.10.0...async-v3.10.1) (2023-10-23)


### Bug Fixes

* **async:** allow empty deps for reatomResource ([47c9a2e](https://github.com/artalar/reatom/commit/47c9a2e4350522ca39af3c5c4cf848a1ad5f967a))

## [3.10.0](https://github.com/artalar/reatom/compare/async-v3.9.4...async-v3.10.0) (2023-10-20)


### Features

* **async:** deprecate reatomAsyncReaction in favor of reatomReactiveAsync ([678adf2](https://github.com/artalar/reatom/commit/678adf2b337b6a895f94e5997739274822332c4f))


### Bug Fixes

* **async:** do not cache aborted promise ([1b6fbe8](https://github.com/artalar/reatom/commit/1b6fbe83ae10a0b170996a16c272a1783d77cb39))

## [3.9.4](https://github.com/artalar/reatom/compare/async-v3.9.3...async-v3.9.4) (2023-10-09)


### Bug Fixes

* **async:** reatomAsyncReaction direct call ([e88b96c](https://github.com/artalar/reatom/commit/e88b96cadfe40ff25432d6bb5d69cbbc20ce67f8))
* **async:** retry abort ([7722626](https://github.com/artalar/reatom/commit/7722626effd408f81a6a1864ce12faa43a617581))

## [3.9.3](https://github.com/artalar/reatom/compare/async-v3.9.2...async-v3.9.3) (2023-09-26)


### Bug Fixes

* **async:** abort should not stale for reatomAsyncReaction ([2a7e272](https://github.com/artalar/reatom/commit/2a7e2720bb5e8a681128eac161535e350fc04c59))
* **async:** prevent unhandled exception for reatomAsyncReaction ([4b940ae](https://github.com/artalar/reatom/commit/4b940aee188ccfcb66a137834f5b877b24321e00))

## [3.9.2](https://github.com/artalar/reatom/compare/async-v3.9.1...async-v3.9.2) (2023-09-13)


### Bug Fixes

* **async:** reatomAsyncReaction withCache ([3bfee9d](https://github.com/artalar/reatom/commit/3bfee9de70e5c645979e81abb6edacde3e8ecac7))

## [3.9.1](https://github.com/artalar/reatom/compare/async-v3.9.0...async-v3.9.1) (2023-09-13)


### Bug Fixes

* **async:** promiseAtomConnection ([cc3b707](https://github.com/artalar/reatom/commit/cc3b707312ba504e8853facf5dce3dbbfafd4bbe))

## [3.9.0](https://github.com/artalar/reatom/compare/async-v3.8.3...async-v3.9.0) (2023-09-13)


### Features

* **async:** add reatomAsyncReaction ([e44e641](https://github.com/artalar/reatom/commit/e44e6417b5795c380e8c2e5dd1e576e7a6462bc0))


### Bug Fixes

* **async:** reatomAsyncReaction AsyncCtxSpy ([c0d014d](https://github.com/artalar/reatom/commit/c0d014d987cf1b3081133b45a146c30e107fb063))

## [3.8.3](https://github.com/artalar/reatom/compare/async-v3.8.2...async-v3.8.3) (2023-08-08)


### Bug Fixes

* **async:** add mapFulfill to dataAtom for correct cache init ([994c0ff](https://github.com/artalar/reatom/commit/994c0ff483c0c8aafea276bc4bc6006bc7b5a1b9))

## [3.8.2](https://github.com/artalar/reatom/compare/async-v3.8.1...async-v3.8.2) (2023-07-22)


### Bug Fixes

* **async:** withStatusesAtom missing ctx ([9c12a7c](https://github.com/artalar/reatom/commit/9c12a7c74dcb2ac5394251e9e0a7fd3c3896d42a))

## [3.8.1](https://github.com/artalar/reatom/compare/async-v3.8.0...async-v3.8.1) (2023-07-12)


### Bug Fixes

* **async:** errorAtom AtomMut ([774ebc0](https://github.com/artalar/reatom/commit/774ebc0c649cac50073c0bdeae47a27780577c5c))

## [3.8.0](https://github.com/artalar/reatom/compare/async-v3.7.0...async-v3.8.0) (2023-07-07)


### Features

* **async:** add "ignoreAbort" and refactor withCache ([f404abf](https://github.com/artalar/reatom/commit/f404abfa36e91db9d109094eee672098ad7c6536))


### Bug Fixes

* **async:** shallow equal memo for withStatusesAtom ([8042e18](https://github.com/artalar/reatom/commit/8042e18dc0d38844628c73ba6a7a2bb2beaf4256))
* **async:** withStatusesAtom and SWR ([b8d2798](https://github.com/artalar/reatom/commit/b8d2798a29b37cbb5f3a441adf4ca332a449ace9))

## [3.7.0](https://github.com/artalar/reatom/compare/async-v3.6.1...async-v3.7.0) (2023-06-12)


### Features

* **async:** refactor withCache, add shouldFulfill option for SWR ([eb54d34](https://github.com/artalar/reatom/commit/eb54d34598ad48dd51ee21cfd2e3c0964bfdc7ae))

## [3.6.1](https://github.com/artalar/reatom/compare/async-v3.6.0...async-v3.6.1) (2023-05-21)


### Bug Fixes

* **all-settled:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **async:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **async:** withCache and withAbort same params ([0466036](https://github.com/artalar/reatom/commit/0466036a2f6cf1dbc3a2f8ce70a5a586825fba85))
* **core-v1:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **core-v2:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **core:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **effects:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **eslint-plugin:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **form-web:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **form:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **framework:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **hooks:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **lens:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **logger:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **navigation:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* new way of hooking up typings [#560](https://github.com/artalar/reatom/issues/560) ([#568](https://github.com/artalar/reatom/issues/568)) ([99550e9](https://github.com/artalar/reatom/commit/99550e98c34df7efd8431282a868a0483bed5dc8))
* **npm-cookie-baker:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **npm-history:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **npm-lit:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **npm-react:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **npm-svelte:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **persist-web-storage:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **persist:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **primitives:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **react-v1:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **react-v2:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **testing:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **timer:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **undo:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **utils:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))

## [3.6.0](https://github.com/artalar/reatom/compare/async-v3.5.2...async-v3.6.0) (2023-05-10)


### Features

* **async:** add withPersist for withCache ([dab74e9](https://github.com/artalar/reatom/commit/dab74e964d8092387e9bcfb24f3724cb088ec38c))

## [3.5.2](https://github.com/artalar/reatom/compare/async-v3.5.1...async-v3.5.2) (2023-04-18)


### Bug Fixes

* **async:** withCache for reject ([034d5ec](https://github.com/artalar/reatom/commit/034d5ec5cc4e7581083707275a6c3dd83f1507e0))

## [3.5.1](https://github.com/artalar/reatom/compare/async-v3.5.0...async-v3.5.1) (2023-04-10)


### Bug Fixes

* **async:** [#489](https://github.com/artalar/reatom/issues/489) error in console ([#534](https://github.com/artalar/reatom/issues/534)) ([2f75da5](https://github.com/artalar/reatom/commit/2f75da59325062c05168199a0c247da79fd3fc38))
