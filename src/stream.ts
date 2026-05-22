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

  async arraify(): Promise<T[]> {
    const array: T[] = []

    for await (const item of this.iterable) {
      array.push(item)
    }

    return array
  }

  async stringify(): Promise<string> {
    let string = ''

    for await (const chunk of this.iterable) {
      string += String(chunk)
    }

    return string
  }
}

export class TextStream extends AsyncStream<string | Buffer> {
  split (separator: string): TextStream {
    const stream = this as TextStream

    return new TextStream((async function* () {
      let parts: string[]
      let buffer = ''

      for await (const chunk of stream) {
        buffer += String(chunk)

        if (buffer.includes(separator)) {
          parts = buffer.split(separator)
          buffer = parts.pop() ?? ''

          yield* parts
        }
      }

      if (buffer) {
        yield buffer
      }
    })())
  }
}
