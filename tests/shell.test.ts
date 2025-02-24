import { Runner } from '@/shell'
import { describe, expect, it } from 'vitest'

describe('Runner', () => {
  const runner = new Runner()

  describe('exec', () => {
    it('returns command output', async () => {
      expect(await runner.exec('echo', ['hello'])).toBe('hello\n')
    })

    it('skips empty args', async () => {
      expect(await runner.exec('echo', ['hello', ''])).toBe('hello\n')
      expect(await runner.exec('echo', ['hello', null])).toBe('hello\n')
      expect(await runner.exec('echo', ['hello', undefined])).toBe('hello\n')
      expect(await runner.exec('echo', ['hello', false])).toBe('hello\n')
    })

    it('throws error from stderr', async () => {
      await expect(runner.exec('git', ['not-a-git-command'])).rejects.toThrow()
    })

    it('throws error from process', async () => {
      await expect(runner.exec('unknown', ['unknown'])).rejects.toThrow()
    })
  })

  describe('run', () => {
    it('returns command output', async () => {
      expect(await runner.run('echo', ['hello']).stringify()).toBe('hello\n')
    })

    it('skips empty args', async () => {
      expect(await runner.run('echo', ['hello', '']).stringify()).toBe('hello\n')
      expect(await runner.run('echo', ['hello', null]).stringify()).toBe('hello\n')
      expect(await runner.run('echo', ['hello', undefined]).stringify()).toBe('hello\n')
      expect(await runner.run('echo', ['hello', false]).stringify()).toBe('hello\n')
    })

    it('throws error from stderr', async () => {
      await expect(runner.run('git', ['not-a-git-command']).stringify()).rejects.toThrow()
    })

    it('throws error from process', async () => {
      await expect(runner.run('unknown', ['unknown']).stringify()).rejects.toThrow()
    })

    it.each([
      10,
      100,
      1000,
    ])('Should process long output (stdout) in chunks', async (max) => {
      const output: string[] = []
      const stdout = runner.run('yes')

      for await (const chunk of stdout.split('\n')) {
        output.push(String(chunk))

        if (output.length >= max) break
      }

      expect(output.length).toBe(max)

      output.forEach((c, i) => {
        expect(c, `Chunk #${i} does not contain "y"`).toContain('y')
      })
    })
  })
})
