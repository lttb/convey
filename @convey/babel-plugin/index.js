import * as t from '@babel/types'
import template from '@babel/template'
import { minimatch } from 'minimatch'
import stringHash from 'string-hash'
import nodePath from 'node:path'

/**
 * @typedef {Object} PluginOptions
 * @property {(string | RegExp | {test: string})[]} [remote] - array of remote resolver path patterns
 * @prop {string} [root] - path to root directory
 */

/**
 * @typedef {import("@babel/core").NodePath<t.CallExpression>} CallNode
 */

const objectAssignTemplate = template.expression('Object.assign(NEW, OLD)')
const spreadTemplate = template.expression('Object.assign(NEW, [SPREAD][0])')

/**
 * @param {Set<any> | Map<any, any>} o
 * @param {unknown} value
 *
 * @returns {boolean}
 */
const has = (o, value) => o.has(value)

const NAMESPACE = '@convey'

const RESOLVER_CREATORS = new Set(['createResolver', 'createResolverStream'])

/**
 * @param {import("@babel/core").ConfigAPI} api - Babel Api
 * @param {PluginOptions} [pluginOptions] - Plugin Options
 *
 * @return {import("@babel/core").PluginObj}
 */
export default (api, pluginOptions = {}) => {
	const options = { root: process.cwd(), ...pluginOptions }

	/**
	 * @param {string} filename
	 * @param {string | RegExp} pattern
	 *
	 * @return {boolean}
	 */
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

				if (!filename) {
					return
				}

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

							const name = t.isStringLiteral(spec.imported)
								? spec.imported.value
								: spec.imported.name
							const binding = importPath.scope.getBinding(name)

							if (!RESOLVER_CREATORS.has(name) || !binding) continue

							for (const ref of binding.referencePaths) {
								const { parentPath } = ref

								if (!parentPath?.isCallExpression()) {
									continue
								}

								const parentVariable = parentPath.parentPath
								const topParent = parentVariable?.parentPath?.parentPath

								if (
									!(
										parentVariable?.isVariableDeclarator() &&
										t.isIdentifier(parentVariable.node.id) &&
										(topParent?.isProgram() ||
											topParent?.isExportNamedDeclaration())
									)
								) {
									continue
								}

								const name = parentVariable.node.id.name

								referenceVars.add(name)
								references.set(parentPath.node, {
									callee: parentPath,
									name,
								})
							}
						}

						importPath.stop()
					},
				})

				const isRemoteResolver = options.remote?.find((pattern) => {
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

						continue
					}

					if (optionsPath.isSpreadElement()) {
						optionsPath.replaceWith(
							spreadTemplate({
								NEW: resolverOptions,
								SPREAD: optionsPath.node,
							}),
						)

						continue
					}

					optionsPath.replaceWith(
						objectAssignTemplate({
							NEW: resolverOptions,
							OLD: optionsPath.node,
						}),
					)
				}

				if (!isRemoteResolver) return

				programPath.node.body = programPath.node.body.filter((node) => {
					if (t.isImportDeclaration(node)) {
						return node.source.value.startsWith(NAMESPACE)
					}

					if (t.isVariableDeclaration(node)) {
						return node.declarations.every((decl) => has(references, decl.init))
					}

					if (t.isExportNamedDeclaration(node)) {
						if (t.isVariableDeclaration(node.declaration)) {
							return node.declaration.declarations.every((decl) =>
								has(references, decl.init),
							)
						}

						return node.specifiers.every((spec) =>
							has(referenceVars, 'local' in spec && spec.local?.name),
						)
					}

					// default exports are not allowed

					return false
				})
			},
		},
	}
}
