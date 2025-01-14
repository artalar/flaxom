// This separate file needed to get this function instance AND TYPES
// without mentioning `globalThis`, as it adds `/// <reference types="node" />` to the bundle
// https://github.com/artalar/reatom/issues/983
// (you can't get `typeof setTimeout` in the index file with `setTimeout` variable in the module scope)
export type SetTimeout = typeof setTimeout
