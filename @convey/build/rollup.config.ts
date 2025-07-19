import typescript from '@rollup/plugin-typescript'
import { defineConfig, type RollupOptions } from 'rollup'

export default (options: RollupOptions) =>
  defineConfig({
    ...options,

    output: {
      dir: 'dist',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: '.',
      ...options.output,
    },

    plugins: [
      typescript({
        exclude: ['**/tests/**', '**/dist/**', '*.config.*', '*.test.*'],
        allowImportingTsExtensions: false,
        declaration: true,
        outDir: 'dist',
        declarationDir: 'dist',
      }),
    ],
  })
