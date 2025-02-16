# Changelog

## [3.10.1](https://github.com/artalar/reatom/compare/core-v3.10.0...core-v3.10.1) (2025-02-16)


### Bug Fixes

* **core:** rename initState to computed in atom overload ([#822](https://github.com/artalar/reatom/issues/822)) ([b96bf36](https://github.com/artalar/reatom/commit/b96bf364bbb2c851513d20e70bbb60d29267a2ef))

## [3.10.0](https://github.com/artalar/reatom/compare/core-v3.9.3...core-v3.10.0) (2025-02-05)


### Features

* **core:** extra log for init update ([d26d615](https://github.com/artalar/reatom/commit/d26d615cc12df427162b23ada77ccff92f58f93b))


### Bug Fixes

* **core:** isBrowser test ([60c7e8f](https://github.com/artalar/reatom/commit/60c7e8fc2fe346960cc2b5d71db1f7cb0d3312c1))

## [3.9.3](https://github.com/artalar/reatom/compare/core-v3.9.2...core-v3.9.3) (2025-01-17)


### Bug Fixes

* **core:** complex connection logic ([f8f3e25](https://github.com/artalar/reatom/commit/f8f3e25324f55fdc01a214d7d3b783ce77f6f68e))

## [3.9.2](https://github.com/artalar/reatom/compare/core-v3.9.1...core-v3.9.2) (2024-12-30)


### Bug Fixes

* **core:** disconnect of the last version of pubs [#996](https://github.com/artalar/reatom/issues/996) ([52b6593](https://github.com/artalar/reatom/commit/52b6593d0485f825110524dcbeeb401d3f9309d4))

## [3.9.1](https://github.com/artalar/reatom/compare/core-v3.9.0...core-v3.9.1) (2024-12-11)


### Bug Fixes

* **core:** mem leak for recursion ([e84e7f6](https://github.com/artalar/reatom/commit/e84e7f634f37e93ac88d8eea0a13f0e727e5fd72))

## [3.9.0](https://github.com/artalar/reatom/compare/core-v3.8.3...core-v3.9.0) (2024-07-16)


### Features

* **core:** add restrictMultipleContexts option and warning ([99e0e3c](https://github.com/artalar/reatom/commit/99e0e3c723a529effc43f0e2a4908806064d30af))

## [3.8.3](https://github.com/artalar/reatom/compare/core-v3.8.2...core-v3.8.3) (2024-06-22)


### Bug Fixes

* **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.8.2](https://github.com/artalar/reatom/compare/core-v3.8.1...core-v3.8.2) (2024-06-22)


### Bug Fixes

* esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
* **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.8.1](https://github.com/artalar/reatom/compare/core-v3.8.0...core-v3.8.1) (2024-06-04)


### Bug Fixes

* **docs:** fixed links to Reatom handbook ([#855](https://github.com/artalar/reatom/issues/855)) ([c9e6a56](https://github.com/artalar/reatom/commit/c9e6a56201c9a496664cd9409fe0fa5dff67606e))

## [3.8.0](https://github.com/artalar/reatom/compare/core-v3.7.0...core-v3.8.0) (2024-04-12)


### Features

* **core:** add batch method ([2e082b6](https://github.com/artalar/reatom/commit/2e082b6296d933ca24046f60ad31b11098027af2))


### Bug Fixes

* **core:** remove extra computation ([6e3d86d](https://github.com/artalar/reatom/commit/6e3d86dc9d8de9dd78a9c10ce4cb3a899e407093))

## [3.7.0](https://github.com/artalar/reatom/compare/core-v3.6.6...core-v3.7.0) (2024-02-16)


### Features

* **core:** add experimental_PLUGINS ([334759c](https://github.com/artalar/reatom/commit/334759c1e20487545a1276f18c14812a1a080fbe))


### Bug Fixes

* **core:** actualization of unsusbscribed atom ([e388afb](https://github.com/artalar/reatom/commit/e388afbbd120aa8fd9aeb3943cb55691e2930f24))

## [3.6.6](https://github.com/artalar/reatom/compare/core-v3.6.5...core-v3.6.6) (2024-01-21)


### Bug Fixes

* **core:** prev value of spy callback ([0abdec0](https://github.com/artalar/reatom/commit/0abdec08c50de9c6622e71b67a4f063aaa9f9343))

## [3.6.5](https://github.com/artalar/reatom/compare/core-v3.6.4...core-v3.6.5) (2023-11-20)


### Bug Fixes

* **core:** nested schedule ([61b3822](https://github.com/artalar/reatom/commit/61b38225b8f7de8eefd7f8f7f6ec079d1ef6de84))

## [3.6.4](https://github.com/artalar/reatom/compare/core-v3.6.3...core-v3.6.4) (2023-11-12)


### Bug Fixes

* **core:** reduce mem usage a little bit ([53c101d](https://github.com/artalar/reatom/commit/53c101de190137a078c18900711dd159373635b5))

## [3.6.3](https://github.com/artalar/reatom/compare/core-v3.6.2...core-v3.6.3) (2023-11-05)


### Bug Fixes

* **core:** small mem improvement ([fd24970](https://github.com/artalar/reatom/commit/fd249701d4f527460443a8cf651d33b3bf153cb4))

## [3.6.2](https://github.com/artalar/reatom/compare/core-v3.6.1...core-v3.6.2) (2023-10-31)


### Bug Fixes

* **core:** conditional deps duplication ([c8968a9](https://github.com/artalar/reatom/commit/c8968a9a98f0554f1164b5857a78910cf61f1da4))

## [3.6.1](https://github.com/artalar/reatom/compare/core-v3.6.0...core-v3.6.1) (2023-10-10)


### Bug Fixes

* **core:** hide spy for updateHooks ([344d2ce](https://github.com/artalar/reatom/commit/344d2ce10676f49999c8c3fb973109e1ac42c57c))

## [3.6.0](https://github.com/artalar/reatom/compare/core-v3.5.0...core-v3.6.0) (2023-10-09)


### Features

* **lens:** add match ([#646](https://github.com/artalar/reatom/issues/646)) ([0f2a768](https://github.com/artalar/reatom/commit/0f2a7685dd797cac4c9fc882a8e24bc31f9503a6))

## [3.5.0](https://github.com/artalar/reatom/compare/core-v3.4.0...core-v3.5.0) (2023-07-07)


### Features

* **core:** make cause not nullable for a user ([b62b9ec](https://github.com/artalar/reatom/commit/b62b9ec968327e5364a16c415ae5822a175ed6b7))


### Bug Fixes

* **core:** ensure that ctx collision is impossible ([ecd8d73](https://github.com/artalar/reatom/commit/ecd8d7353cb0c229e80dba26224d0de268bde5ff))
* **core:** improve cause tracking ([f578511](https://github.com/artalar/reatom/commit/f578511f8b2a44bc91d3b9f82a791229c095193f))
* **core:** onChange, onCall types ([581e7a0](https://github.com/artalar/reatom/commit/581e7a01f1f7ba033744f0b508af718b287f5f7f))
* **core:** use only change cause ([21752ad](https://github.com/artalar/reatom/commit/21752ad6255f6c3ba0634c50da05fae3d401b7bd))

## [3.4.0](https://github.com/artalar/reatom/compare/core-v3.3.1...core-v3.4.0) (2023-06-12)


### Features

* **core:** [#578](https://github.com/artalar/reatom/issues/578) add update hooks ([fd5f92a](https://github.com/artalar/reatom/commit/fd5f92abe270f59531ad3af41e8073509eedec4a))


### Bug Fixes

* **core:** do not call updateHooks on init ([300281f](https://github.com/artalar/reatom/commit/300281f1f7610cbe37201be914292d5c811d6cdd))
* **core:** fix type error  (nullable atom) ([#574](https://github.com/artalar/reatom/issues/574)) ([06d123b](https://github.com/artalar/reatom/commit/06d123ba118ac98996d6653ab2377e56516ad84b))
* **core:** onCall types ([d3c6940](https://github.com/artalar/reatom/commit/d3c6940ca1f6001a4136e558cf00965de304a6ab))
* **core:** unify cause setter ([e565d1f](https://github.com/artalar/reatom/commit/e565d1fd647583bbb6098b3b41024c9b7d458439))
* **core:** update hook for atom without cache ([d4c164a](https://github.com/artalar/reatom/commit/d4c164ad9b17406adaae7baa7e3e337df0e43a3d))
* **core:** updateHooks should be called only for computers ([acfa682](https://github.com/artalar/reatom/commit/acfa68243e6d48323a90dceb81755e5826cd9215))

## [3.3.1](https://github.com/artalar/reatom/compare/core-v3.3.0...core-v3.3.1) (2023-05-21)


### Bug Fixes

* **all-settled:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
* **async:** change build output ([5bedebd](https://github.com/artalar/reatom/commit/5bedebda3a1ee92850d10f767686303b8ec2ba0e))
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

## [3.3.0](https://github.com/artalar/reatom/compare/core-v3.2.0...core-v3.3.0) (2023-05-10)


### Features

* **core:** fix the order of an atom update and computed ([acdba1f](https://github.com/artalar/reatom/commit/acdba1f241c1bd5dcf52c8bfa49c38da3a8510d9))
