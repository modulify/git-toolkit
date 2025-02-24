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
})

describe('TextStream', () => {
  it('should split strings stream by a separator', async () => {
    const text = new TextStream(Readable.from(['1 2', ' 3', ' 4 5 6']))

    expect(await text.split(' ').arraify()).toEqual(['1', '2', '3', '4', '5', '6'])
  })
})