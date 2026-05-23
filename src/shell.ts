import type { Arg } from '~types/arg'
import type { SpawnOptionsWithoutStdio } from 'node:child_process'

import { TextStream } from '@/stream'

import { spawn } from 'node:child_process'

export interface RunnerOptions extends Omit<SpawnOptionsWithoutStdio, 'shell'> {
  shell?: false;
  maxStdoutBuffer?: number;
  maxStderrBuffer?: number;
}

const DEFAULT_MAX_STDERR_BUFFER = 1024 * 1024

export class Runner {
  readonly cwd: string

  constructor(cwd?: string) {
    this.cwd = cwd ?? process.cwd()
  }

  /** Executes a command in a child process & returns its output as string */
  async exec (cmd: string, args: Arg[] = [], options: RunnerOptions = {}) {
    return await this.run(cmd, args, options).stringify({
      maxBuffer: options.maxStdoutBuffer,
    })
  }

  /** Spawns a child process for a command and returns its stdout stream */
  run (cmd: string, args: Arg[] = [], options: RunnerOptions = {}) {
    const {
      maxStderrBuffer = DEFAULT_MAX_STDERR_BUFFER,
      shell,
    } = options
    const spawnOptions: Partial<RunnerOptions> = { ...options }

    delete spawnOptions.maxStdoutBuffer
    delete spawnOptions.maxStderrBuffer
    delete spawnOptions.shell

    const cwd = this.cwd
    assertShellDisabled(shell)

    return new TextStream((async function* () {
      const child = spawn(cmd, filterArgs(args), {
        ...cwd && { cwd },
        ...spawnOptions,
      })

      let closed = false
      const mayEndWithError = new Promise<Error | null>((resolve) => {
        let stderr = ''
        let error: Error | null = null

        child.stderr.on('data', (chunk: Buffer) => {
          stderr += String(chunk)

          if (stderr.length > maxStderrBuffer && !error) {
            error = new Error(`stderr exceeded maxStderrBuffer limit (${maxStderrBuffer})`)
            child.kill()
          }
        })
        child.on('error', (e: Error) => error = e)
        child.on('close', () => {
          closed = true

          if (stderr && !error) {
            error = new Error(stderr)
          }

          resolve(error)
        })
      })
      const stdout = (child.stdout as AsyncIterable<Buffer>)[Symbol.asyncIterator]()

      try {
        while (true) {
          const next = await stdout.next()
          if (next.done) {
            break
          }

          yield next.value
        }

        const error = await mayEndWithError
        if (error) {
          throw error
        }
      } finally {
        if (!closed) {
          child.kill()
          child.stdout.destroy()
          child.stderr.destroy()
          child.unref()
        }
      }
    })())
  }
}

function assertShellDisabled(shell: unknown) {
  if (shell) {
    throw new Error('shell option is not supported')
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
