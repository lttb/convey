import { createResolver } from '..'

{
	const test = createResolver(async (a: number, b: string) => {})

	await test(1, 'a')

	// @ts-expect-error Argument of type 'number' is not assignable to parameter of type 'string'
	await test(1, 2)
}

{
	const test = createResolver(async function (
		this: { a: number },
		a: number,
		b: string,
	) {})

	await test.call({ a: 1 }, 1, 'a')

	// @ts-expect-error The 'this' context of type 'void' is not assignable to method's 'this' of type '{ a: number; }'
	await test(1, 2)

	// @ts-expect-error Type 'string' is not assignable to type 'number'
	await test.call({ a: 'x' }, 1, 2)
}
