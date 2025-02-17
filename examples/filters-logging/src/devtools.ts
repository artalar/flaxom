import { Devtools } from "@reatom/devtools"

declare global {
  // eslint-disable-next-line no-var
  var DEVTOOLS: null | Devtools
}
globalThis.DEVTOOLS = null
if (import.meta.env.DEV) {
  const { createDevtools } = await import("@reatom/devtools")
  globalThis.DEVTOOLS = createDevtools({})
}
