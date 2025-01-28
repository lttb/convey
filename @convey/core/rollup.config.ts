import config from '@convey/build/rollup.config'

export default config({
	input: ['index.ts', 'client/index.ts', 'server/index.ts'],
})
