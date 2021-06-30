const withTM = require('next-transpile-modules')([
    '@convey/core',
    '@convey/react',
]);

module.exports = withTM();
