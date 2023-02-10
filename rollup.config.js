import typescript from '@rollup/plugin-typescript'

const config = [
  // ES module build (replaces broken basic TypeScript compilation)
  // * ref: <https://github.com/microsoft/TypeScript/issues/18442> , <https://github.com/alshdavid/rxjs/blob/main/rollup.config.js#L10>
  // * ref: <https://github.com/microsoft/TypeScript/pull/35148>
  // * ref: <https://github.com/microsoft/TypeScript/issues/37582>
  {
    preserveModules: true, // or `false` to bundle as a single file
    input: [
      './@convey/core/index.ts',
      './@convey/core/client/index.ts',
      './@convey/core/server/index.ts',
      './@convey/react/index.ts',
      './@convey/babel-plugin/index.js',
    ],
    output: [{dir: 'lib/@convey', format: 'esm', entryFileNames: '[name].mjs'}],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
]

export default config
