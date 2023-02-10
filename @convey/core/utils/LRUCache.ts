import invariant from 'invariant'

export class LRUCache<K = any, V = any> {
    capacity: number
    map: Map<K, V>

    constructor(capacity) {
        this.capacity = capacity

        this.map = new Map()
    }

    _move(key, value) {
        this.map.delete(key)
        this.map.set(key, value)
    }

    has(key) {
        return this.map.has(key)
    }

    set(key, value) {
        this._move(key, value)
        if (this.map.size <= this.capacity) return

        const deleteKey = this.map.keys().next().value
        this.map.delete(deleteKey)
    }

    get(key) {
        const value = this.map.get(key)

        invariant(value, `there is no key "${key}"`)

        this._move(key, value)
        return value
    }

    delete(key) {
        this.map.delete(key)
    }
}
