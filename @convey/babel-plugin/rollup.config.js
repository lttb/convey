import commonConfig from '../../rollup.config.common';

const config = {
    ...commonConfig,

    output: [{dir: 'lib', format: 'cjs', entryFileNames: '[name].js'}],
    input: ['index.js'],
};

export default config;
