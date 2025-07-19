const path = require('node:path')

const withConvey = require('@convey/next-plugin')({
  config(options) {
    return {
      remote: options.isServer
        ? ['**/resolvers/web/**']
        : ['**/resolvers/server/**'],
    }
  },
})

module.exports = withConvey({
  compress: false,

  transpilePackages: ['@convey/core', '@convey/react'],

  webpack: (config) => {
    config.resolve.symlinks = true

    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, './node_modules/react'),
    }

    return config
  },
})
