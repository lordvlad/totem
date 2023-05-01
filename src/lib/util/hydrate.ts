
export function hydrate<D extends Record<string, unknown>, T extends Function>(data: D, typ: T) {
    return Object.assign(Object.create(typ.prototype), data);
}
