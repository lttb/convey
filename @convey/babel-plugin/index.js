const t = require('@babel/types')
const { minimatch } = require('minimatch')
const stringHash = require('string-hash')
const nodePath = require('node:path')

/**
 * @typedef {Object} PluginOptions
 * @property {(string | RegExp | {test: string})[]} remote - array of remote resolver path patterns
 * @prop {string} root - path to root directory
 */

/**
 * @typedef {import("@babel/core").NodePath<t.CallExpression>} CallNode
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

	const options = { root: process.cwd(), ...pluginOptions }

	function isRemotePattern(filename, pattern) {
		if (pattern instanceof RegExp) {
			return pattern.test(filename)
		}

		return (
			filename.startsWith(pattern) ||
			minimatch(filename, pattern, { matchBase: true })
		)
	}

	return {
		name: '@convey/babel-plugin',

		visitor: {
			Program(programPath, state) {
				const { filename } = state.file.opts

				/** @type {Map<t.Node, {callee: CallNode, name: string}>} */
				const references = new Map()
				/** @type {Set<string>} */
				const referenceVars = new Set()

				programPath.traverse({
					ImportDeclaration(importPath) {
						const { source, specifiers } = importPath.node

						if (!source.value.startsWith(NAMESPACE)) {
							return
						}

						for (const spec of specifiers) {
							if (!t.isImportSpecifier(spec)) continue

							const name = spec.imported.name || spec.imported.value
							const binding = importPath.scope.getBinding(name)

							if (!RESOLVER_CREATORS.has(name)) continue

							for (const ref of binding.referencePaths) {
								const { parentPath } = ref
								if (!t.isCallExpression(parentPath)) continue

								const parentVariable = parentPath.parentPath

								if (
									t.isVariableDeclarator(parentVariable) &&
									(t.isProgram(parentVariable.parentPath.parentPath) ||
										t.ExportNamedDeclaration(
											parentVariable.parentPath.parentPath,
										))
								) {
									const name = parentVariable.node.id.name

									referenceVars.add(name)
									references.set(parentPath.node, {
										callee: parentPath,
										name,
									})
								}
							}
						}

						importPath.stop()
					},
				})

				const isRemoteResolver = options.remote.find((pattern) => {
					if (typeof pattern === 'string' || pattern instanceof RegExp) {
						return isRemotePattern(filename, pattern)
					}

					return isRemotePattern(filename, pattern.test)
				})

				const fileHash = stringHash(nodePath.relative(options.root, filename))

				for (const ref of references.values()) {
					const resolverName = ref.name

					const resolverOptions = t.objectExpression([
						t.objectProperty(
							t.identifier('id'),
							t.stringLiteral(`${fileHash}:${resolverName}`),
						),
					])

					const [, optionsPath] = ref.callee.get('arguments')

					if (isRemoteResolver) {
						// replace to createResolver(null, {id: 'hash'})
						ref.callee.node.arguments = [
							// TODO: consider null
							t.objectExpression([]),
							resolverOptions,
						]

						continue
					}

					if (!optionsPath) {
						ref.callee.pushContainer('arguments', resolverOptions)
					} else {
						resolverOptions.properties.push(...optionsPath.node.properties)

						optionsPath.replaceWith(resolverOptions)
					}
				}

				if (!isRemoteResolver) return

				programPath.node.body = programPath.node.body.filter((node) => {
					if (t.isImportDeclaration(node)) {
						return node.source.value.startsWith(NAMESPACE)
					}

					if (t.isVariableDeclaration(node)) {
						return node.declarations.every((decl) => references.has(decl.init))
					}

					if (t.isExportNamedDeclaration(node)) {
						if (t.isVariableDeclaration(node.declaration)) {
							return node.declaration.declarations.every((decl) =>
								references.has(decl.init),
							)
						}

						return node.specifiers.every((spec) =>
							referenceVars.has(spec.local?.name),
						)
					}

					// default exports are not allowed

					return false
				})
			},
		},
	}
}
