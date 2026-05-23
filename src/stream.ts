export interface ArraifyOptions {
  maxItems?: number;
}

export interface StringifyOptions {
  maxBuffer?: number;
}

export interface SplitOptions {
  maxBuffer?: number;
}

const DEFAULT_MAX_ITEMS = 10000
const DEFAULT_MAX_BUFFER = 10 * 1024 * 1024

export class AsyncStream<T> implements AsyncIterable<T> {
  constructor(private iterable: AsyncIterable<T>) {}

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return this.iterable[Symbol.asyncIterator]()
  }

  async first(): Promise<T | null> {
    const iterator = this[Symbol.asyncIterator]()
    let done = false

    try {
      const first = await iterator.next()
      done = Boolean(first.done)

      return first.done ? null : first.value
    } finally {
      if (!done) {
        await iterator.return?.()
      }
    }
  }

  async arraify(options: ArraifyOptions = {}): Promise<T[]> {
    const maxItems = options.maxItems ?? DEFAULT_MAX_ITEMS
    const array: T[] = []

    for await (const item of this.iterable) {
      if (array.length >= maxItems) {
        throw new Error(`stream output exceeded maxItems limit (${maxItems})`)
      }

      array.push(item)
    }

    return array
  }

  async stringify(options: StringifyOptions = {}): Promise<string> {
    const maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER
    let string = ''

    for await (const chunk of this.iterable) {
      const next = String(chunk)

      if (string.length + next.length > maxBuffer) {
        throw new Error(`stream output exceeded maxBuffer limit (${maxBuffer})`)
      }

      string += next
    }

    return string
  }
}

export class TextStream extends AsyncStream<string | Buffer> {
  split (separator: string, options: SplitOptions = {}): TextStream {
    const stream = this as TextStream
    const maxBuffer = options.maxBuffer ?? DEFAULT_MAX_BUFFER

    return new TextStream((async function* () {
      let parts: string[]
      let buffer = ''

      for await (const chunk of stream) {
        buffer += String(chunk)

        if (buffer.length > maxBuffer) {
          throw new Error(`stream split buffer exceeded maxBuffer limit (${maxBuffer})`)
        }

        if (buffer.includes(separator)) {
          parts = buffer.split(separator)
          buffer = parts.pop() as string

          yield* parts
        }
      }

      if (buffer) {
        yield buffer
      }
    })())
  }
}
