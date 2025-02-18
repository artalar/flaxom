const { atom, createCtx } = require('@reatom/framework')
const me = atom('check ✅', 'me')
const ctx = createCtx()
console.log('CommonJS import:', ctx.get(me))
