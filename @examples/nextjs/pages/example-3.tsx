import { useResolver } from '@convey/react'

import { getData } from '@examples/nextjs/resolvers/server/example-3'
import { BaseError, Tags } from '@examples/nextjs/entities'

const Demo = () => {
	const [data] = useResolver(getData(new Tags(['client'])))

	if (data === undefined) {
		return <div>Loading...</div>
	}

	if (data instanceof BaseError) {
		return <div>Error: {data.code}</div>
	}

	return (
		<div>
			<p>Tags: {[...data.tags].join(',')}</p>
			<p>CreatedAt: {data.createdAt.toLocaleDateString()}</p>
		</div>
	)
}

export default function Simple() {
	return (
		<>
			<Demo />
		</>
	)
}
