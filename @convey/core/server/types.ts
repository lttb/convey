import type { Resolver } from '@convey/core'

export type ResolverMap = Record<string, Resolver<any, any>>

export type ResolverRequestBody = { b: string }
