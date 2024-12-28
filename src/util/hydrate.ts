export function hydrate<T extends new (...args: unknown[]) => unknown>(
  data: Record<string | number | symbol, unknown>,
  typ: T,
): InstanceType<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument -- we know what we're doing
  return Object.assign(Object.create(typ.prototype), data);
}
