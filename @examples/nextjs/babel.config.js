const path = require('path')

function isWebTarget(caller) {
  return caller?.target !== 'node'
}

module.exports = (api) => ({
  presets: [
    [
      'next/babel',
      {
        'preset-env': {targets: {browsers: 'last 2 Chrome versions'}},
      },
    ],
  ],
  plugins: [
    [
      require.resolve('../../@convey/babel-plugin'),
      {
        // call by babel-loader
        remote: api.caller(isWebTarget)
          ? [path.join(__dirname, '/resolvers/server/**')]
          : [path.join(__dirname, '/resolvers/web/**')],
      },
    ],
  ],
})
