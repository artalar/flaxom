import { atom, createCtx } from '@reatom/framework'
const me = atom('check ✅', 'me')
const ctx = createCtx()
console.log('ESM import:', ctx.get(me))
