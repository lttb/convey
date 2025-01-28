import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
	input: ['index.ts', 'client/index.ts', 'server/index.ts'],
	output: {
		dir: 'dist',
		format: 'es',
		preserveModules: true,
		preserveModulesRoot: '.',
	},
	plugins: [
		typescript({
			exclude: ['**/tests/**', '**/dist/**'],
			declaration: true,
			outDir: 'dist',
			declarationDir: 'dist',
		}),
	],
})
