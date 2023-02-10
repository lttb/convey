const nodePath = require('path')

const t = require('@babel/types')
const minimatch = require('minimatch')
const stringHash = require('string-hash')

/**
 * @typedef {Object} PluginOptions
 * @property {(string | RegExp | {test: string})[]} remote - array of remote resolver path patterns
 * @prop {string} root - path to root directory
 */

const NAMESPACE = '@convey'

const RESOLVER_CREATORS = new Set(['createResolver', 'createResolverStream'])

/**
 * @param {import("@babel/core").ConfigAPI} api - Babel Api
 * @param {PluginOptions} pluginOptions - Plugin Options
 *
 * @return {import("@babel/core").PluginObj}
 */
module.exports = (api, pluginOptions = {}) => {
  api.cache(true)

  const options = {root: process.cwd(), ...pluginOptions}

  function getToplevelPath(path) {
    let currPath = path

    while (!t.isProgram(currPath.parentPath)) {
      currPath = currPath.parentPath
    }

    return currPath
  }

  function isRemotePattern(filename, pattern) {
    if (pattern instanceof RegExp) {
      return pattern.test(filename)
    }

    return (
      filename.startsWith(pattern) ||
      minimatch(filename, pattern, {matchBase: true})
    )
  }

  return {
    name: '@convey/babel-plugin',

    visitor: {
      Program(programPath, state) {
        const {filename} = state.file.opts
        const resolverPaths = new Set()

        /** @type {import("@babel/core").NodePath[]} */
        let referencePaths = []

        programPath.traverse({
          ImportDeclaration(importPath) {
            const {source, specifiers} = importPath.node

            if (!source.value.startsWith(NAMESPACE)) {
              return
            }

            resolverPaths.add(getToplevelPath(importPath))

            for (const spec of specifiers) {
              if (!t.isImportSpecifier(spec)) continue

              const name = spec.imported.name || spec.imported.value

              const binding = importPath.scope.getBinding(name)

              if (!RESOLVER_CREATORS.has(name)) continue

              referencePaths.push(...binding.referencePaths)
            }

            importPath.stop()
          },
        })

        if (!referencePaths.length) return

        const isRemoteResolver = options.remote.find((pattern) => {
          if (typeof pattern === 'string' || pattern instanceof RegExp) {
            return isRemotePattern(filename, pattern)
          }

          return isRemotePattern(filename, pattern.test)
        })

        // TODO: hash function could be configurable
        const fileHash = stringHash(nodePath.relative(options.root, filename))

        for (const refPath of referencePaths) {
          const functionPath = refPath.parentPath

          // TODO: add variable declaration assertion + maybe hashing
          const resolverName = functionPath.parentPath.node.id.name

          const resolverOptions = t.objectExpression([
            t.objectProperty(
              t.identifier('id'),
              t.stringLiteral(`${fileHash}:${resolverName}`),
            ),
          ])

          const [, optionsPath] = functionPath.get('arguments')

          if (isRemoteResolver) {
            resolverPaths.add(getToplevelPath(functionPath))

            // replace to createResolver(null, {id: 'hash'})
            functionPath.node.arguments = [
              // TODO: consider null
              t.objectExpression([]),
              resolverOptions,
            ]

            continue
          }

          if (!optionsPath) {
            functionPath.pushContainer('arguments', resolverOptions)
          } else {
            resolverOptions.properties.push(...optionsPath.node.properties)

            optionsPath.replaceWith(resolverOptions)
          }
        }

        if (!isRemoteResolver) return

        programPath.get('body').forEach((x) => {
          if (resolverPaths.has(x)) return

          x.remove()
        })
      },
    },
  }
}
