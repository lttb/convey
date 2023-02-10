import {createResolver} from '@convey/core';

import {PrismaClient, User} from '@prisma/client';

import {BaseError} from '@examples/nextjs/entities';

const prisma = new PrismaClient();

export const getUserIds = createResolver(async function () {
    const users = await prisma.user.findMany({
        select: {id: true},
    });

    return users;
});

export const getUser = createResolver(async function (id: User['id']) {
    const user = await prisma.user.findUnique({
        where: {id},
    });

    return user;
});

export const createUser = createResolver(async function ({
    name,
    email,
}: Pick<User, 'name' | 'email'>) {
    const user = await prisma.user.create({
        data: {
            name,
            email,
        },
    });

    return user;
});

export const updateUserName = createResolver(async function (
    id: User['id'],
    name: User['name']
) {
    const user = await prisma.user.update({
        where: {
            id,
        },
        data: {
            name,
        },
    });

    return user;
});
