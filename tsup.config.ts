import {defineConfig} from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  splitting: true,
  treeshake: true,
  dts: true,
  clean: true,
  format: ['cjs', 'esm'],
})
