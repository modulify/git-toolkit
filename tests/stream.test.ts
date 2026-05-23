import {
  AsyncStream,
  TextStream,
} from '@/stream'

import { Readable } from 'stream'

import { describe, expect, it } from 'vitest'

describe('AsyncStream', () => {
  it('returns first element if not empty', async () => {
    const stream = new AsyncStream(Readable.from(['1 2', ' 3', ' 4 5 6']))

    expect(await stream.first()).toEqual('1 2')
  })

  it('returns null as first element if empty', async () => {
    const stream = new AsyncStream(Readable.from([]))

    expect(await stream.first()).toEqual(null)
  })

  it('closes upstream iterator after first element', async () => {
    let closed = false

    const stream = new AsyncStream((async function* () {
      try {
        yield 'first'
        yield 'second'
      } finally {
        closed = true
      }
    })())

    expect(await stream.first()).toEqual('first')
    expect(closed).toBe(true)
  })

  it('enforces max items when collecting stream into array', async () => {
    const stream = new AsyncStream(Readable.from(['1', '2']))

    await expect(stream.arraify({ maxItems: 1 })).rejects.toThrow('maxItems limit')
  })

  it('enforces max buffer when collecting stream into string', async () => {
    const stream = new AsyncStream(Readable.from(['hello']))

    await expect(stream.stringify({ maxBuffer: 3 })).rejects.toThrow('maxBuffer limit')
  })
})

describe('TextStream', () => {
  it('should split strings stream by a separator', async () => {
    const text = new TextStream(Readable.from(['1 2', ' 3', ' 4 5 6']))

    expect(await text.split(' ').arraify()).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it('returns buffered text when separator is missing', async () => {
    const text = new TextStream(Readable.from(['hello', ' world']))

    expect(await text.split(',').arraify()).toEqual(['hello world'])
  })

  it('enforces max buffer while splitting stream', async () => {
    const text = new TextStream(Readable.from(['hello', ' world']))

    await expect(text.split(',', { maxBuffer: 3 }).arraify()).rejects.toThrow('split buffer')
  })
})
