import type {ResolverStructure} from '../types';

const paramsOrder = new Map<string, number>();

export function getParamsHash(params) {
    if (Array.isArray(params)) {
        return params.map((param) => getParamsHash(param)).join('_');
    }

    if (!params) return String(params);
    if (params.toJSON) return JSON.stringify(params.toJSON());
    if (typeof params !== 'object') {
        return String(params);
    }

    let hash = '';
    for (let param in params) {
        if (!paramsOrder.has(param)) {
            paramsOrder.set(param, paramsOrder.size);
        }

        hash += `$${paramsOrder.get(param)}:${getParamsHash(params[param])}$`;
    }
    return hash;
}

const HASH_KEY = '__hash__';

export function getResolverHash(structure: ResolverStructure<any, any>) {
    if (!structure) {
        return '';
    }

    // minor hash access optimization
    if (structure[HASH_KEY]) {
        return structure[HASH_KEY];
    }

    let hash;

    if (structure.options.getHash) {
        hash = structure.options?.getHash(structure);
    } else {
        hash =
            getParamsHash(structure.params) +
            '/' +
            getParamsHash(structure.context);
    }

    structure[HASH_KEY] = hash;

    return hash;
}
