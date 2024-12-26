
export function zip<T> (a: T[], b: T[]) {
  if (a.length !== b.length) throw new Error(`Arrays must have same length: a has size ${a.length}, b has size ${b.length}`)
  const zipped = new Array<T>(a.length * 2)
  for (let i = 0; i < a.length; i++) zipped.push(a[i], b[i])
  return zipped
}
