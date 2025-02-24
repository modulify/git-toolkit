import type { Arg } from '~types/arg'
import type { SpawnOptionsWithoutStdio } from 'node:child_process'

import { TextStream } from '@/stream'

import { spawn } from 'node:child_process'

export class Runner {
  readonly cwd: string

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd()
  }

  /** Executes a command in a child process & returns its output as string */
  async exec (cmd: string, args: Arg[] = [], options: SpawnOptionsWithoutStdio = {}) {
    return await this.run(cmd, args, options).stringify()
  }

  /** Spawns a child process for a command and returns its stdout stream */
  run (cmd: string, args: Arg[] = [], options: SpawnOptionsWithoutStdio = {}) {
    const cwd = this.cwd

    return new TextStream((async function* () {
      const child = spawn(cmd, filterArgs(args), {
        ...cwd && { cwd },
        ...options,
      })

      const mayEndWithError = new Promise<Error | null>((resolve) => {
        let stderr = ''
        let error: Error | null = null

        child.stderr.on('data', (chunk: Buffer) => stderr += String(chunk))
        child.on('error', (e: Error) => error = e)
        child.on('close', () => {
          if (stderr) {
            error = new Error(stderr)
          }

          resolve(error)
        })
      })

      yield* child.stdout as AsyncIterable<Buffer>

      const error = await mayEndWithError
      if (error) {
        throw error
      }
    })())
  }
}

function filterArgs(args: Arg[]): string[] {
  return args.reduce<string[]>((final, arg) => {
    if (arg) {
      final.push(String(arg))
    }

    return final
  }, [])
}
