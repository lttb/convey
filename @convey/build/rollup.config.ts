import { defineConfig, type RollupOptions } from 'rollup'
import typescript from '@rollup/plugin-typescript'

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
				exclude: ['**/tests/**', '**/dist/**', '*.config.*'],
				allowImportingTsExtensions: false,
				noCheck: true,
				declaration: true,
				outDir: 'dist',
				declarationDir: 'dist',
			}),
		],
	})
