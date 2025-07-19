import path from 'node:path'
import babel from '@babel/core'
import conveyBabelPlugin from '@convey/babel-plugin'

const SUPPORTED_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.astro'])

/**
 * @typedef {Object} RemoteOptions
 * @prop {(string | RegExp | {test: string})[]} server
 * @prop {(string | RegExp | {test: string})[]} client
 */

/**
 * @typedef {Object} PluginOptions
 * @prop {RemoteOptions} remote - array of remote resolver path patterns
 * @prop {string} [root] - path to root directory
 */

/**
 * @param {PluginOptions} options
 **/
function conveyPlugin({ root: conveyRoot, remote }) {
  /** @type {import('vite').Plugin} */
  const plugin = {
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
            {
              root: conveyRoot || root,
              remote: options?.ssr ? remote?.server : remote?.client,
            },
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
