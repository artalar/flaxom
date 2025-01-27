import { it, expect } from 'vitest'

import {} from './'

// export const Counter = (props) => {
//   const [count, setCount] = useState(props.value ?? 0)
//   const inc = useCallback(() => setCount((s) => s + 1), [setCount])
//   const dec = useCallback(() => setCount((s) => s - 1), [setCount])
//   return (
//     <div>
//       <button onClick={dec}>-</button>
//       <span>{count}</span>
//       <button onClick={inc}>+</button>
//     </div>
//   )
// }
// export const Counter = reatomComponent((initCtx, initProps) => {
//   const countAtom = atom(initProps.value ?? 0)
//   const inc = () => countAtom(initCtx, (v) => v + 1)
//   const dec = () => countAtom(initCtx, (v) => v - 1)
//   return (ctx, props) => (
//     <div>
//       <button onClick={dec}>-</button>
//       <span>{ctx.spy(countAtom)}</span>
//       <button onClick={inc}>+</button>
//     </div>
//   )
// })

it(`base API`, async () => {
  // TODO
})
