/**
 * Zero-copy fixed-size circular ring buffer.
 *
 * The backing array is allocated once at construction. `push` overwrites the
 * oldest slot in place via sequential pointer wrapping, so steady-state
 * ingestion performs no allocation and produces no garbage-collection churn —
 * which is the whole point for high-frequency ticker / attention streams.
 *
 * Reads that need an ordered view (`toArray`, `slice`) allocate only the
 * result they return; the hot path (`push`, `latest`, `forEach`, `reduce`)
 * never allocates.
 */
export class RingBuffer<T> {
  readonly capacity: number

  private readonly buffer: Array<T | undefined>
  /** Index of the next write. */
  private head = 0
  /** Number of valid items currently stored (<= capacity). */
  private length = 0

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError(`RingBuffer capacity must be a positive integer, received ${String(capacity)}`)
    }
    this.capacity = capacity
    this.buffer = new Array<T | undefined>(capacity)
  }

  get size(): number {
    return this.length
  }

  get isFull(): boolean {
    return this.length === this.capacity
  }

  get isEmpty(): boolean {
    return this.length === 0
  }

  /** Append an item, overwriting the oldest entry once full. O(1), no allocation. */
  push(item: T): void {
    this.buffer[this.head] = item
    this.head = this.head + 1 === this.capacity ? 0 : this.head + 1
    if (this.length < this.capacity) {
      this.length += 1
    }
  }

  /** Most recently pushed item, or undefined when empty. */
  latest(): T | undefined {
    if (this.length === 0) {
      return undefined
    }
    const index = this.head === 0 ? this.capacity - 1 : this.head - 1
    return this.buffer[index]
  }

  /** Oldest stored item, or undefined when empty. */
  oldest(): T | undefined {
    if (this.length === 0) {
      return undefined
    }
    return this.buffer[this.startIndex()]
  }

  /** Walk items oldest-first without materializing an array. */
  forEach(visitor: (item: T, ordinal: number) => void): void {
    const start = this.startIndex()
    for (let i = 0; i < this.length; i += 1) {
      let index = start + i
      if (index >= this.capacity) {
        index -= this.capacity
      }
      visitor(this.buffer[index] as T, i)
    }
  }

  /** Fold over items oldest-first without intermediate allocation. */
  reduce<A>(reducer: (accumulator: A, item: T) => A, initial: A): A {
    let accumulator = initial
    this.forEach((item) => {
      accumulator = reducer(accumulator, item)
    })
    return accumulator
  }

  /**
   * Iterate newest-first, stopping as soon as `predicate` returns false.
   * Useful for time-windowed scans (e.g. "all ticks in the last 60s") where
   * the stream is ordered and we can bail out early.
   */
  forEachReverseWhile(predicate: (item: T) => boolean): void {
    for (let i = 0; i < this.length; i += 1) {
      let index = this.head - 1 - i
      if (index < 0) {
        index += this.capacity
      }
      if (!predicate(this.buffer[index] as T)) {
        return
      }
    }
  }

  /** Ordered (oldest-first) copy. Allocates exactly one array of `size`. */
  toArray(): T[] {
    const out = new Array<T>(this.length)
    this.forEach((item, ordinal) => {
      out[ordinal] = item
    })
    return out
  }

  /** Ordered copy of the newest `count` items (oldest-first within the slice). */
  slice(count: number): T[] {
    const take = Math.max(0, Math.min(count, this.length))
    const out = new Array<T>(take)
    const skip = this.length - take
    let written = 0
    this.forEach((item, ordinal) => {
      if (ordinal >= skip) {
        out[written] = item
        written += 1
      }
    })
    return out
  }

  clear(): void {
    this.head = 0
    this.length = 0
    // Drop references so retained objects can be collected; cheap relative to
    // ingestion rate and only happens on explicit reset.
    this.buffer.fill(undefined)
  }

  private startIndex(): number {
    const start = this.head - this.length
    return start < 0 ? start + this.capacity : start
  }
}
