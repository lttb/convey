import type { Resolver } from '..'

export type ResolverMap = Record<string, Resolver<any, any>>

export type ResolverRequestBody = { b: string }
