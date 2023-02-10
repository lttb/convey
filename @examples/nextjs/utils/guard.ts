import * as s from 'superstruct'

export const guard = <
    St extends s.Struct<any, any>,
    C extends any,
    Cb extends (this: C, data: St['TYPE']) => any,
>(
    struct: St,
    cb: Cb,
) =>
    function (this: C, data: s.Infer<St>): ReturnType<Cb> {
        return cb.call(this, s.create(data, struct))
    }
