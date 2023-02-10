import commonConfig from '../../rollup.config.common'

const config = {
    ...commonConfig,

    input: ['index.ts', 'client/index.ts', 'server/index.ts'],
}

export default config
