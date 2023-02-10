import commonConfig from '../../rollup.config.common'

const config = {
    ...commonConfig,

    input: ['index.ts', 'ServerComponent.ts'],
    external: ['react', '@convey/core'],
}

export default config
