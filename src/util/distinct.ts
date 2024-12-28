export function distinct<K extends string>(key: K) {
  return function <T extends Record<K, unknown>>(elements: T[]) {
    const vals: unknown[] = [];
    return elements.filter((elem) => {
      const k = elem[key];
      if (vals.includes(k)) {
        return false;
      } else {
        vals.push(k);
        return true;
      }
    });
  };
}
