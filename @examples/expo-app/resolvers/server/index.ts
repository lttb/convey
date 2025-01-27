import { $ } from 'bun'

export const getDate = createResolver(async () => {
	return $`date`.text()
})
