export * from './guard'

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
