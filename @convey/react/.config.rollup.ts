import config from '@convey/build/rollup.config'

export default config({
	input: ['index.ts', 'ServerComponent.ts', 'stream.ts'],
})
