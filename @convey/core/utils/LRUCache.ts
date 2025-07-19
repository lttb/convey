export class LRUCache<K = any, V = any> {
  capacity: number
  map: Map<K, V>

  constructor(capacity: number) {
    this.capacity = capacity

    this.map = new Map()
  }

  _move(key: K, value: V) {
    this.map.delete(key)
    this.map.set(key, value)
  }

  has(key: any) {
    return this.map.has(key)
  }

  set(key: K, value: V) {
    this._move(key, value)
    if (this.map.size <= this.capacity) return

    const deleteKey = this.map.keys().next().value
    if (deleteKey) {
      this.map.delete(deleteKey)
    }
  }

  get(key: K) {
    const value = this.map.get(key)

    if (!value) {
      return
    }

    this._move(key, value)
    return value
  }

  delete(key: K) {
    this.map.delete(key)
  }
}
