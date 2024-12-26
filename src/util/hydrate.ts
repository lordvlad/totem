export function hydrate<D extends {}, T extends Function> (data: D, typ: T) {
  return Object.assign(Object.create(typ.prototype), data)
}
