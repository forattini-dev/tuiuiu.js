import { describe, it, expect, vi } from 'vitest'
import { createSignal, createEffect, batch, createMemo, Signal, Effect } from '../../src/core/signal.js'

describe('Signal', () => {
  it('should create a signal with initial value', () => {
    const [count] = createSignal(0)
    expect(count()).toBe(0)
  })

  it('should update signal value', () => {
    const [count, setCount] = createSignal(0)
    setCount(5)
    expect(count()).toBe(5)
  })

  it('should update signal with function', () => {
    const [count, setCount] = createSignal(10)
    setCount(c => c + 1)
    expect(count()).toBe(11)
  })

  it('should not trigger effect when same value', () => {
    const [count, setCount] = createSignal(5)
    const fn = vi.fn(() => count())
    createEffect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    setCount(5) // Same value
    expect(fn).toHaveBeenCalledTimes(1) // No additional call
  })
})

describe('Signal Class', () => {
  it('should get value using getter', () => {
    const signal = new Signal(42)
    expect(signal.value).toBe(42)
  })

  it('should set value using setter', () => {
    const signal = new Signal(0)
    signal.value = 10
    expect(signal.value).toBe(10)
  })

  it('should peek without tracking', () => {
    const signal = new Signal(100)
    expect(signal.peek()).toBe(100)
  })

  it('should update with function', () => {
    const signal = new Signal(5)
    signal.update(v => v * 2)
    expect(signal.value).toBe(10)
  })

  it('should unsubscribe effect', () => {
    const signal = new Signal(0)
    const fn = vi.fn()
    const effect = new Effect(() => {
      signal.value
      fn()
    })
    expect(fn).toHaveBeenCalledTimes(1)
    signal.unsubscribe(effect)
    signal.value = 1
    expect(fn).toHaveBeenCalledTimes(1) // No additional call
  })
})

describe('Effect Class', () => {
  it('should run immediately on creation', () => {
    const fn = vi.fn()
    new Effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should track dependencies', () => {
    const signal = new Signal(0)
    const fn = vi.fn(() => signal.value)
    new Effect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
    signal.value = 1
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should dispose effect', () => {
    const signal = new Signal(0)
    const fn = vi.fn(() => signal.value)
    const effect = new Effect(fn)
    effect.dispose()
    signal.value = 1
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should cleanup on dispose', () => {
    const cleanup = vi.fn()
    const effect = new Effect(() => cleanup)
    effect.dispose()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})

describe('Effect', () => {
  it('should run effect immediately', () => {
    const fn = vi.fn()
    createEffect(fn)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should track signal dependencies', () => {
    const [count, setCount] = createSignal(0)
    const fn = vi.fn(() => count())

    createEffect(fn)
    expect(fn).toHaveBeenCalledTimes(1)

    setCount(1)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('should cleanup on re-run', () => {
    const cleanup = vi.fn()
    const [count, setCount] = createSignal(0)

    createEffect(() => {
      count()
      return cleanup
    })

    expect(cleanup).not.toHaveBeenCalled()
    setCount(1)
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('should track multiple signals', () => {
    const [a, setA] = createSignal(1)
    const [b, setB] = createSignal(2)
    const fn = vi.fn()
    createEffect(() => {
      a() + b()
      fn()
    })
    expect(fn).toHaveBeenCalledTimes(1)
    setA(10)
    expect(fn).toHaveBeenCalledTimes(2)
    setB(20)
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('Batch', () => {
  it('should batch multiple updates', () => {
    const [count, setCount] = createSignal(0)
    const fn = vi.fn(() => count())

    createEffect(fn)
    expect(fn).toHaveBeenCalledTimes(1)

    batch(() => {
      setCount(1)
      setCount(2)
      setCount(3)
    })

    // Effect should only run once after batch
    expect(fn).toHaveBeenCalledTimes(2)
    expect(count()).toBe(3)
  })

  it('should handle nested batches', () => {
    const [count, setCount] = createSignal(0)
    const fn = vi.fn(() => count())
    createEffect(fn)

    batch(() => {
      setCount(1)
      batch(() => {
        setCount(2)
      })
      setCount(3)
    })

    expect(count()).toBe(3)
  })

  it('should execute batch callback', () => {
    const callback = vi.fn()
    batch(callback)
    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('Memo', () => {
  it('should compute derived value', () => {
    const [count] = createSignal(5)
    const doubled = createMemo(() => count() * 2)

    expect(doubled()).toBe(10)
  })

  it('should update when dependency changes', () => {
    const [count, setCount] = createSignal(5)
    const doubled = createMemo(() => count() * 2)

    setCount(10)
    expect(doubled()).toBe(20)
  })

  it('should cache computed value', () => {
    const fn = vi.fn((x: number) => x * 2)
    const [count] = createSignal(5)
    const doubled = createMemo(() => fn(count()))

    doubled()
    doubled()
    doubled()

    // Should only compute once until dependency changes
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should recompute when dependency changes', () => {
    const fn = vi.fn((x: number) => x * 2)
    const [count, setCount] = createSignal(5)
    const doubled = createMemo(() => fn(count()))

    doubled()
    expect(fn).toHaveBeenCalledTimes(1)

    setCount(10)
    doubled()
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
