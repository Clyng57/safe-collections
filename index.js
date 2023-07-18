
/* eslint-disable no-useless-constructor */
/* eslint-disable no-labels */

const { bind, call } = Function.prototype

/**
 *
 * @template {(...args: unknown[]) => unknown} T
 * @type {(fn: T) => (self: ThisParameterType<T>, ...args: Parameters<T>) => ReturnType<T>}
 */
const uncurryThis = bind.bind(call)

/**
 * Creates a class that can be safely iterated over.
 *
 * Because these functions are used by `makeSafe`, which is exposed on the
 * `primordials` object, it's important to use const references to the
 * primordials that they use.
 * @template {Iterable} T
 * @template {*} TReturn
 * @template {*} TNext
 * @param {(self: T) => IterableIterator<T>} factory
 * @param {(...args: [] | [TNext]) => IteratorResult<T, TReturn>} next
 * @returns {Iterator<T, TReturn, TNext>}
 */
const createSafeIterator = (factory, next) => {
  class SafeIterator {
    #iterator

    constructor (iterable) {
      this.#iterator = factory(iterable)
    }

    next () {
      return next(this.#iterator)
    }

    [Symbol.iterator] () {
      return this
    }
  }

  Object.setPrototypeOf(SafeIterator.prototype, null)
  Object.freeze(SafeIterator.prototype)
  Object.freeze(SafeIterator)
  return SafeIterator
}

const copyProps = (src, dest) => {
  Reflect.ownKeys(src).forEach((key) => {
    if (!Reflect.getOwnPropertyDescriptor(dest, key)) {
      Reflect.defineProperty(
        dest,
        key,
        { __proto__: null, ...Reflect.getOwnPropertyDescriptor(src, key) })
    }
  })
}

/**
 *
 * @template T
 * @template N
 * @param {T} unsafe
 * @param {N} safe
 * @returns {N}
 */
const makeSafe = (unsafe, safe) => {
  if (Symbol.iterator in unsafe.prototype) {
    const dummy = new unsafe()
    let next // We can reuse the same `next` method.

    Reflect.ownKeys(unsafe.prototype).forEach((key) => {
      if (!Reflect.getOwnPropertyDescriptor(safe.prototype, key)) {
        const desc = Reflect.getOwnPropertyDescriptor(unsafe.prototype, key)
        if (
          typeof desc.value === 'function' &&
          desc.value.length === 0 &&
          Symbol.iterator in (Function.prototype.call(desc.value, dummy) ?? {})
        ) {
          const createIterator = uncurryThis(desc.value)
          next ??= uncurryThis(createIterator(dummy).next)
          const SafeIterator = createSafeIterator(createIterator, next)
          desc.value = function () {
            return new SafeIterator(this)
          }
        }
        Reflect.defineProperty(safe.prototype, key, { __proto__: null, ...desc })
      }
    })
  } else {
    copyProps(unsafe.prototype, safe.prototype)
  }
  copyProps(unsafe, safe)

  Object.setPrototypeOf(safe.prototype, null)
  Object.freeze(safe.prototype)
  Object.freeze(safe)
  return safe
}

const SafeMap = makeSafe(
  Map,
  class SafeMap extends Map {
    constructor (i) { super(i) }
  }
)

const SafeWeakMap = makeSafe(
  WeakMap,
  class SafeWeakMap extends WeakMap {
    constructor (i) { super(i) }
  }
)

const SafeSet = makeSafe(
  Set,
  class SafeSet extends Set {
    constructor (i) { super(i) }
  }
)

export {
  SafeMap,
  SafeSet,
  SafeWeakMap
}
