
export class SafeMap<K, V> extends Map<K, V> {
  constructor (entries?: Array<[K, V]> | undefined)
}

export class SafeWeakMap<K extends object, V> extends WeakMap<K, V> {
  constructor (entries?: Array<[K, V]> | undefined)
}

export class SafeSet<V> extends Set<V> {
  constructor (values?: Array<V> | undefined)
}
