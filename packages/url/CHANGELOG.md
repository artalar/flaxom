# Changelog

## [3.8.0](https://github.com/artalar/reatom/compare/url-v3.7.5...url-v3.8.0) (2024-11-05)


### Features

* **url:** add subpath parameter ([#945](https://github.com/artalar/reatom/issues/945)) ([e9d882d](https://github.com/artalar/reatom/commit/e9d882d0749b5aa82a4732d3d02fbd8d65254883))
* **url:** path instead of path ([526f9a7](https://github.com/artalar/reatom/commit/526f9a73d4f5a4b738a6cb049f616ca4ce79fc03))

## [3.7.5](https://github.com/artalar/reatom/compare/url-v3.7.4...url-v3.7.5) (2024-10-11)


### Bug Fixes

* **url:** setting reinitialization ([742b303](https://github.com/artalar/reatom/commit/742b30370ba86bed048ecbd9fddf4c02242cd2fe))

## [3.7.4](https://github.com/artalar/reatom/compare/url-v3.7.3...url-v3.7.4) (2024-10-08)


### Bug Fixes

* **url:** computed handling ([80bb777](https://github.com/artalar/reatom/commit/80bb777215842684cefbf0cc5bbbd5bd2ab791e0))

## [3.7.3](https://github.com/artalar/reatom/compare/url-v3.7.2...url-v3.7.3) (2024-06-22)


### Bug Fixes

* **npm-svelte:** republish without tag ([93c7f7f](https://github.com/artalar/reatom/commit/93c7f7f5ec58247b1b3aec854cd83b0a0ecd6a6c))

## [3.7.2](https://github.com/artalar/reatom/compare/url-v3.7.1...url-v3.7.2) (2024-06-22)


### Bug Fixes

* esm module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))
* **new-package-template:** use mjs in module export ([1011671](https://github.com/artalar/reatom/commit/10116719dd92d8102352a39e4ed772b8173d8668))

## [3.7.1](https://github.com/artalar/reatom/compare/url-v3.7.0...url-v3.7.1) (2024-03-23)


### Bug Fixes

* **url:** sync links with location ([17e8b54](https://github.com/artalar/reatom/commit/17e8b54d3990745dc2498ac60eef0e0d95dd5fb2))

## [3.7.0](https://github.com/artalar/reatom/compare/url-v3.6.2...url-v3.7.0) (2024-02-16)


### Features

* **url:** add replace option ([c6ae085](https://github.com/artalar/reatom/commit/c6ae0859fd246135e17379623e91a67ffeedbb59))


### Bug Fixes

* **url:** updateFromSource indirect check ([05b55ec](https://github.com/artalar/reatom/commit/05b55ecf973dbb43e91226390bdf102c17455f88))

## [3.6.2](https://github.com/artalar/reatom/compare/url-v3.6.1...url-v3.6.2) (2023-11-26)


### Bug Fixes

* **url:** accept a function in urlAtom update ([5affb85](https://github.com/artalar/reatom/commit/5affb8525fe5629621e0f7fe9b999f1e2306b28e))
* **url:** simplify path types ([6c905b5](https://github.com/artalar/reatom/commit/6c905b5424a9d85c20059db04c3c03551cef9c5b))

## [3.6.1](https://github.com/artalar/reatom/compare/url-v3.6.0...url-v3.6.1) (2023-11-23)


### Bug Fixes

* **url:** use spy in match ([0a8320c](https://github.com/artalar/reatom/commit/0a8320c02ef8036816c3361fae852eaf159b359c))

## [3.6.0](https://github.com/artalar/reatom/compare/url-v3.5.0...url-v3.6.0) (2023-11-20)


### Features

* **url:** stop abortCauseContext propagation ([b8daac9](https://github.com/artalar/reatom/commit/b8daac98b2638fbe170aebed7816afec9e73928f))

## [3.5.0](https://github.com/artalar/reatom/compare/url-v3.4.1...url-v3.5.0) (2023-11-05)


### Features

* **url:** add updateFromSource ([209133f](https://github.com/artalar/reatom/commit/209133f1426583729aac394fdf5e2a484252c3eb))


### Bug Fixes

* **url:** reinit qs persist state when the param was removed ([59135f8](https://github.com/artalar/reatom/commit/59135f883681bed433fb5ab36111ca9d478e05fb))

## [3.4.1](https://github.com/artalar/reatom/compare/url-v3.4.0...url-v3.4.1) (2023-10-31)


### Bug Fixes

* **url:** compatibility with different routes [#671](https://github.com/artalar/reatom/issues/671) ([b4f5761](https://github.com/artalar/reatom/commit/b4f5761a8cde3697e4a9192e88ccc42ff8378bba))

## [3.4.0](https://github.com/artalar/reatom/compare/url-v3.3.1...url-v3.4.0) (2023-10-20)


### Features

* **url:** add SearchParamsAtom.del and persist refactor ([af86da3](https://github.com/artalar/reatom/commit/af86da339cf0ba864eec9d074aa9f8b14c403fd2))

## [3.3.1](https://github.com/artalar/reatom/compare/url-v3.3.0...url-v3.3.1) (2023-10-09)


### Bug Fixes

* **url:** parse empty QS as empty string ([3665807](https://github.com/artalar/reatom/commit/3665807cdbe131f87a414ac5907cd8a88cafe769))

## [3.3.0](https://github.com/artalar/reatom/compare/url-v3.2.0...url-v3.3.0) (2023-08-05)


### Features

* **url:** add "go" action and "match" atom creator ([b297e1a](https://github.com/artalar/reatom/commit/b297e1af737728693d5980704669377bd99b4d22))
* **url:** added! ([7467a38](https://github.com/artalar/reatom/commit/7467a387350ef435c0594e3045da1c86bf1e235a))


### Bug Fixes

* **url:** popstate and hash handling ([d7fbe55](https://github.com/artalar/reatom/commit/d7fbe5586a6707713e8981b381c8dcb5056ccad9))
* **url:** use isCausedBy ([75c64f7](https://github.com/artalar/reatom/commit/75c64f7ae314f0d58a8c8f5e175f35b7237fcf25))

## 3.2.0

### Features

- feat(url): add "go" action and "match" atom creator

### Bug Fixes

- fix(url): popstate and hash handling
