/**
 * @typedef {import('next').NextConfig} NextConfig
 */

/**
 * @typedef {import('next/dist/server/config-shared').WebpackConfigContext} WebpackConfigContext
 */

/**
 * @typedef {import('@convey/babel-plugin').PluginOptions} PluginOptions
 */

/** @param {{
 config(value: WebpackConfigContext): PluginOptions
}} pluginOptions */
module.exports = (pluginOptions) => {
	/** @param {NextConfig} nextConfig */
	return (nextConfig) => {
		/** @type {NextConfig} */
		const config = {
			webpack(config, options) {
				const conveyOptions = pluginOptions.config(options)

				config.module.rules.push({
					test: /\.(tsx|ts|js|mjs|jsx|mdx|md)$/,
					exclude: /node_modules/,
					use: {
						loader: require.resolve('./loader.cjs'),
						options: conveyOptions,
					},
				})

				if (typeof nextConfig.webpack === 'function') {
					return nextConfig.webpack(config, options)
				}

				return config
			},
		}

		return Object.assign({}, nextConfig, config)
	}
}
