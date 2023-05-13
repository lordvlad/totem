export function distinct<K extends string,>(key: K) {
    return function <T extends { [k in K]: any },>(elements: T[]) {
        const vals: any[] = []
        return elements.filter(elem => {
            const k = elem[key]
            if (vals.includes(k)) {
                return false
            } else {
                vals.push(k)
                return true
            }
        })
    }
}