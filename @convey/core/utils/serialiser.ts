/**
 * UNSTABLE
 *
 * A candidate for a separate package @convey/serializer
 */

const classesByKey = {};

const DATA_KEY = Symbol('data');

type Primitive =
    | string
    | number
    | boolean
    | null
    | undefined
    | void
    | symbol
    | (string & object)
    | (number & object);

export interface IEntity<R> {
    contains(value: unknown): value is this;
    eq(value: this): boolean;
    value: R;
}

type WrapData<T> = (T extends Primitive ? Readonly<{value: T}> : T) &
    Readonly<IEntity<T>>;

const toPrimitive = (value: any) => {
    if (!value) return value;

    if (value[Symbol.toPrimitive]) return value[Symbol.toPrimitive]();
    if (value.valueOf) return value.valueOf();
    if (value.toString) return value.toString();

    return value;
};

export interface IRegistrar {
    register(name: string): void;
}

export function createEntityNamespace(name: string) {
    const ns = `_${name}_`;

    function entity<T = void>(): IRegistrar & (new (data: T) => WrapData<T>);

    function entity<C extends new (...args: void[]) => any>(
        constr: C
    ): IRegistrar &
        (new (...args: ConstructorParameters<C> | []) => WrapData<
            InstanceType<C>
        >);

    function entity<C extends new (...args: any[]) => any>(
        constr: C
    ): IRegistrar &
        (new (...args: ConstructorParameters<C>) => WrapData<InstanceType<C>>);

    function entity<C extends (...args: any[]) => any>(
        constr: C
    ): IRegistrar & (new (...args: Parameters<C>) => WrapData<ReturnType<C>>);

    function entity<T extends any[], R>(
        constr?: new (...args: [...T]) => R
    ): any {
        const isConstructor =
            typeof constr === 'function' &&
            constr.prototype &&
            constr.prototype.constructor?.name;

        const Parent = isConstructor ? constr : class {};

        const keysByClass = new WeakMap();

        return class extends Parent implements IEntity<R> {
            [DATA_KEY]: T;

            value: R;

            static register(name: string) {
                const key = `${ns}.${name}`;

                classesByKey[key] = this;
                keysByClass.set(this, key);
            }

            contains(value: unknown): value is this {
                return value instanceof this.constructor;
            }

            eq(value: this) {
                return toPrimitive(value) === toPrimitive(this);
            }

            [Symbol.toPrimitive]?: () => any;

            constructor(...args: [...T]) {
                super(...args);

                this[DATA_KEY] = args;

                if (isConstructor) return;

                const value = constr
                    ? // @ts-expect-error - call as a function
                      constr(...args)
                    : args[0];

                if (value && typeof value === 'object') {
                    Object.assign(this, value);
                } else {
                    this[Symbol.toPrimitive] = () => value;
                }

                this.valueOf = () => value;
                this.toString = () => String(value);

                this.value = value;
            }

            toJSON() {
                const key = keysByClass.get(this.constructor);

                if (!key) {
                    throw new Error(
                        `Entity.toJSON: Cannot serialise ${this.constructor.name}`
                    );
                }

                return ['*', key, JSON.stringify(this[DATA_KEY]), '*'];
            }
        };
    }

    return entity;
}

// TODO: use Entity class as a type instead of any
export const registerEntities = (entityMap: Record<string, IRegistrar>) => {
    Object.entries(entityMap).forEach(
        ([name, cls]) => cls.register && cls.register(name)
    );
};

export const entityReviver = (key: string, value: any) => {
    const isEntity =
        value && value[0] === '*' && value[3] === '*' && value.length === 4;

    if (!isEntity) return value;

    const entityKey = value[1];
    const entityValue = value[2];

    const CL = classesByKey[entityKey];
    if (!CL) return value;

    return new CL(...JSON.parse(entityValue, entityReviver));
};
