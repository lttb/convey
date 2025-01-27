const babel = require('@babel/core')
const conveyBabelPlugin = require('@convey/babel-plugin')
const path = require('node:path')

/** @type {import('webpack').LoaderDefinition} */
const loader = function (code) {
	const callback = this.async()
	const id = this.resourcePath
	const options = this.getOptions()

	const root = process.cwd()

	const extname = path.extname(id)

	const isTypescript = extname === '.tsx' || extname === '.ts'

	babel
		.transformAsync(code, {
			babelrc: false,
			configFile: false,
			ast: false,
			root,
			filename: id,
			parserOpts: {
				allowAwaitOutsideFunction: true,
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
			plugins: [[conveyBabelPlugin, options]],
			sourceMaps: true,
			inputSourceMap: false,
		})
		.then((result) => {
			callback(null, result.code, result.map)
		})
		.catch((err) => {
			callback(err)
		})
}

module.exports = loader
