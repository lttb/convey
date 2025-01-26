const path = require('path')

const withConvey = require('@convey/next-plugin')({
	config(options) {
		return {
			remote: options.isServer
				? [path.join(__dirname, '/resolvers/web/**')]
				: [path.join(__dirname, '/resolvers/server/**')],
		}
	},
})

module.exports = withConvey({
	compress: false,

	transpilePackages: ['@convey/core', '@convey/react'],

	webpack: (config) => {
		config.resolve.symlinks = true

		return config
	},
})
