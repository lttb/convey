export class _Promise<T> extends Promise<T> {
  resolve!: (value: T | PromiseLike<T>) => void
  reject!: <E extends Error>(error: E) => void

  constructor() {
    super((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}
