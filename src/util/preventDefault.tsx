export function pd<E extends Event>(f: (e: E) => void) {
    return function (e: E) {
        e.preventDefault();
        e.stopPropagation();
        f(e);
    };
}
