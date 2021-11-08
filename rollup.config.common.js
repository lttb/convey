import typescript from 'rollup-plugin-typescript2';
import copy from 'rollup-plugin-copy';

const config =
    // ES module build (replaces broken basic TypeScript compilation)
    // * ref: <https://github.com/microsoft/TypeScript/issues/18442> , <https://github.com/alshdavid/rxjs/blob/main/rollup.config.js#L10>
    // * ref: <https://github.com/microsoft/TypeScript/pull/35148>
    // * ref: <https://github.com/microsoft/TypeScript/issues/37582>
    {
        preserveModules: true, // or `false` to bundle as a single file
        output: [{dir: 'lib', format: 'esm', entryFileNames: '[name].mjs'}],
        plugins: [
            typescript({
                tsconfig: 'tsconfig.json',
                useTsconfigDeclarationDir: true,
            }),

            copy({
                targets: [
                    {src: 'README.md', dest: 'lib'},
                    {src: 'CHANGELOG.md', dest: 'lib'},
                    {
                        src: 'package.json',
                        dest: 'lib',
                        transform: (contents, filename) =>
                            JSON.stringify({
                                main: 'index.mjs',
                                types: 'index.d.ts',
                                ...JSON.parse(contents.toString()),
                            }),
                    },
                ],
            }),
        ],
    };

export default config;
