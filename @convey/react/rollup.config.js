import commonConfig from '../../rollup.config.common';

const config = {
    ...commonConfig,

    input: ['index.ts'],
    external: ['react', '@convey/core'],
};

export default config;
