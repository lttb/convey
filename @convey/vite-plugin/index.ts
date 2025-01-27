import path from 'node:path'
import babel from '@babel/core'
import conveyBabelPlugin from '@convey/babel-plugin'
import type { Plugin } from 'vite'

const SUPPORTED_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.astro'])

/**
 * @param {object} options
 **/
function conveyPlugin({
	root,
	remote,
}: { root?: string; remote?: { server?: string; client?: string } }) {
	/** @type {import('vite').Plugin} */
	const plugin: Plugin = {
		name: '@convey/vite-plugin',

		async transform(code, id, options) {
			const root = process.cwd()

			const extname = path.extname(id)

			if (!SUPPORTED_EXTENSIONS.has(extname)) {
				return
			}

			const isTypescript = extname === '.tsx' || extname === '.ts'

			// console.log({ code })

			const result = await babel.transformAsync(code, {
				babelrc: false,
				configFile: false,
				ast: false,
				root,
				filename: id,
				parserOpts: {
					allowAwaitOutsideFunction: true,
					// @ts-expect-error expect
					plugins: [
						'importMeta',
						'topLevelAwait',
						'classProperties',
						'classPrivateProperties',
						'classPrivateMethods',
						'jsx',
					].concat(isTypescript ? ['typescript'] : []),
				},
				generatorOpts: {
					decoratorsBeforeExport: true,
				},
				plugins: [
					[
						conveyBabelPlugin,
						{ root, remote: options?.ssr ? remote?.server : remote?.client },
					],
				],
				sourceMaps: true,
			})

			return {
				code: result?.code || code,
				map: result?.map,
			}
		},
	}

	return plugin
}

export default conveyPlugin
