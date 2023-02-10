const withTM = require('next-transpile-modules')([
    '@convey/core',
    '@convey/react',
])

module.exports = withTM({
    compress: false,

    webpack: (config) => {
        config.resolve.symlinks = true

        return config
    },
})
