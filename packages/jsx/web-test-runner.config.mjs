import { esbuildPlugin } from '@web/dev-server-esbuild'

export default {
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      tsx: true,
      jsxFactory: 'h',
      jsxFragment: 'hf',
    }),
  ],
}
