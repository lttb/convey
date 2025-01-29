import { createResolver } from '@convey/core'

import { PrismaClient, type User } from '@prisma/client'

import { BaseError } from '@examples/nextjs/entities'

const prisma = new PrismaClient()

export const getUserIds = createResolver(async () => {
	const users = await prisma.user.findMany({
		select: { id: true },
	})

	return users
})

export const getUser = createResolver(async (id: User['id']) => {
	const user = await prisma.user.findUnique({
		where: { id },
	})

	return user
})

export const createUser = createResolver(
	async ({ name, email }: Pick<User, 'name' | 'email'>) => {
		const user = await prisma.user.create({
			data: {
				name,
				email,
			},
		})

		return user
	},
)

export const updateUserName = createResolver(
	async (id: User['id'], name: User['name']) => {
		const user = await prisma.user.update({
			where: {
				id,
			},
			data: {
				name,
			},
		})

		return user
	},
)
