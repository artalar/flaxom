---
title: Reatom FAQ
description: Frequently asked questions about Reatom
---

## Package Updates

When updating Reatom packages, you may encounter type incompatibilities or unexpected runtime errors due to your package manager's deduplication policy. Some Reatom packages are singletons, like [@reatom/effects](/package/effects) with its internal `CauseContext`. However, there are no standards for this type of package, and different package managers may deduplicate them differently.

Therefore, we recommend running deduplication manually after updating Reatom packages. For example, if you have installed `@reatom/framework` and `@reatom/web`, and you want to update the framework to the latest version, use one of the following commands.

NPM has special flag to deduplicate related packages during installation:

```bash
npm i --prefer-dedupe @reatom/framework@latest
```

`yarn@1` deduplicates packages by default during installation, but `yarn@3` and `yarn@4` do not. For these versions, you need to run deduplication manually:

```sh
yarn add @reatom/framework@latest && yarn dedupe "@reatom/*"
```

PNPM does not deduplicate packages by default, and there isn't a deduplication command for a specific set of packages. You need to manually remove all installed Reatom packages and install it again:

```sh
pnpm rm @reatom/framework @reatom/web && pnpm i @reatom/framework@latest @reatom/web@latest
```

## Multiple contexts

Sometimes you may see this error message in your console: "Reatom: multiple contexts detected, which is irrelevant in the browser, you should use only one context". This warning is triggered when you create multiple contexts in the same production environment, which makes no sense and is probably a bug. The reason to have many contexts is a server environment, for testing or SSR and so on.
Reatom detects the browser environment by checking `!!globalThis.navigator?.userAgent`, which is `false` for Node.js. However, if your server environment has this property in the global namespace, you can set the `restrictMultipleContexts` option to `false` of the `createCtx` API.
