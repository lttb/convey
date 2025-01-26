/** @param {{
 config(value: import("next/dist/server/config-shared").WebpackConfigContext): import("@convey/babel-plugin").PluginOptions
}} pluginOptions */
module.exports = (pluginOptions) => {
	/** @param {import('next').NextConfig} nextConfig */
	return (nextConfig) => {
		/** @type {import('next').NextConfig} */
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
