import { createResolver } from '@convey/core'

import {
	BaseError,
	EntityDate,
	MyComplicatedStructure,
	Tags,
} from '@examples/nextjs/entities'

export const getData = createResolver(async (tags: Tags) => {
	if (!tags.has('required')) {
		return new BaseError({ code: 'no required tag' })
	}

	return new MyComplicatedStructure({
		createdAt: new EntityDate(),
		tags: new Tags([...tags, 'server']),
	})
})
