const path = require('node:path')

module.exports = (api) => {
	api.cache(true)

	return {
		presets: ['babel-preset-expo'],

		plugins: [
			['@convey', { remote: [path.join(__dirname, '**/resolvers/server/**')] }],
		],
	}
}
