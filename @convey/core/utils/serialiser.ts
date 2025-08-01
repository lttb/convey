/**
 * UNSTABLE
 *
 * A candidate for a separate package @convey/serializer
 */

const classesByKey: Record<string, any> = {}

const DATA_KEY = Symbol('data')

type Primitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | (string & object)
  | (number & object)

export interface IEntity<R> {
  eq(value: this): boolean
  value: R
}

type WrapData<T> = (T extends Primitive ? Readonly<{ value: T }> : T) &
  Readonly<IEntity<T>>

const toPrimitive = (value: any) => {
  if (!value) return value

  if (value[Symbol.toPrimitive]) return value[Symbol.toPrimitive]()
  if (value.valueOf) return value.valueOf()
  if (value.toString) return value.toString()

  return value
}

export interface IRegistrar<T> {
  register(name: string): void
  contains(value: unknown): value is T
}

export function createEntityNamespace(name: string) {
  const ns = `_${name}_`

  function entity<T = void>(): IRegistrar<T> & (new (data: T) => WrapData<T>)

  function entity<C extends new (...args: []) => any>(
    constr: C,
  ): IRegistrar<C> &
    (new (
      ...args: ConstructorParameters<C> | []
    ) => WrapData<InstanceType<C>>)

  function entity<C extends new (...args: any[]) => any>(
    constr: C,
  ): IRegistrar<C> &
    (new (
      ...args: ConstructorParameters<C>
    ) => WrapData<InstanceType<C>>)

  function entity<C extends (...args: any[]) => any>(
    constr: C,
  ): IRegistrar<C> & (new (...args: Parameters<C>) => WrapData<ReturnType<C>>)

  function entity<T extends any[], R>(
    constr?: new (...args: [...T]) => R,
  ): any {
    const isConstructor =
      typeof constr === 'function' &&
      constr.prototype &&
      constr.prototype.constructor?.name

    const Parent = isConstructor ? constr : class {}

    let key: string

    return class Entity extends Parent implements IEntity<R> {
      [DATA_KEY]: T

      // @ts-expect-error
      value: R

      static register(name: string) {
        const entityKey = `${ns}.${name}`

        if (key && entityKey !== key) {
          throw new Error(
            `Entity.register: ${name} is already registered as ${key}`,
          )
        }

        key = entityKey

        classesByKey[key] = Entity
      }

      static contains(value: unknown): value is Entity {
        return value instanceof Entity
      }

      eq(value: this) {
        return toPrimitive(value) === toPrimitive(this)
      }

      [Symbol.toPrimitive]?: () => any

      constructor(...args: [...T]) {
        super(...args)

        this[DATA_KEY] = args

        if (isConstructor) return

        const value = constr
          ? // @ts-expect-error - call as a function
            constr(...args)
          : args[0]

        if (value && typeof value === 'object') {
          Object.assign(this, value)
        } else {
          this[Symbol.toPrimitive] = () => value
        }

        this.valueOf = () => value
        this.toString = () => String(value)

        this.value = value

        // console.log('name', this.constructor.name);
      }

      toJSON() {
        if (!key) {
          throw new Error(
            `Entity.toJSON: ${this.constructor.name} was not registered`,
          )
        }

        return [this[DATA_KEY], '∈', key]
      }
    }
  }

  return entity
}

export const entity = createEntityNamespace('_')

// TODO: use Entity class as a type instead of any
export const registerEntities = (
  entityMap: Record<string, IRegistrar<any>>,
) => {
  for (const [name, cls] of Object.entries(entityMap)) {
    cls?.register(name)
  }
}

export const entityReviver = (key: string, value: any) => {
  const isEntity = value && value[1] === '∈' && value.length === 3

  if (!isEntity) return value

  const entityKey = value[2]
  const entityValue = value[0]

  const CL = classesByKey[entityKey]
  if (!CL) return value

  return new CL(...entityValue)
}
