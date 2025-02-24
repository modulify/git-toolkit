import type { Arg } from '~types/arg'

import type {
  GitCommitOptions,
  GitLogOptions,
  GitRevParseOptions,
  GitTagOptions,
} from '~types/git'

import type { SpawnOptionsWithoutStdio } from 'node:child_process'

import { AsyncStream } from '@/stream'
import { Runner } from './shell'

export class GitCommander {
  private readonly sh: Runner

  constructor (options: { cwd?: string, sh?: Runner } = {}) {
    this.sh = options.sh ?? new Runner(options.cwd)
  }

  get cwd () {
    return this.sh.cwd
  }

  /** Add files to git index. */
  async add (files: string[]) {
    await this.exec('add', ['--', ...files])
  }

  /** Check file is ignored via .gitignore. */
  async checkIgnore(file: string) {
    try {
      return Boolean(await this.exec('check-ignore', ['--', file]))
    } catch {
      return false
    }
  }

  /** Commit changes. */
  async commit (options: GitCommitOptions) {
    const {
      verify = true,
      files = [],
    } = options

    await this.exec('commit', [
      ...(verify ? [] : ['--no-verify']),
      ...(options.sign ? ['-S'] : []),
      '-m', options.message,
      '--', ...files,
    ])
  }

  log (options: GitLogOptions = {}) {
    const {
      from = '',
      to = 'HEAD',
      since,
      order = [],
      color = true,
      decorate,
    } = options

    return this.run('log', [
      ...(options.format ? [`--format=${options.format}`] : []),
      ...(since ? [`--since=${since instanceof Date ? since.toISOString() : since}`] : []),
      ...order.map(o => `--${o}-order`),
      ...(options.reverse ? ['--reverse'] : []),
      ...(options.merges ? ['--merges'] : []),
      ...(options.merges === false ? ['--no-merges'] : []),
      ...(color ? [] : ['--no-color']),
      ...(decorate ? [typeof decorate === 'string' ? `--decorate=${decorate}` : '--decorate'] : []),
      [from, to].filter(Boolean).join('..'),
      ...options.path ? ['--', ...arraify(options.path)] : [],
    ])
  }

  /** Push changes to remote. */
  async push (branch: string) {
    await this.exec('push', ['--follow-tags', 'origin', '--', branch])
  }

  async revParse (rev: string, options: GitRevParseOptions = {}) {
    return await this.exec('rev-parse', [
      ...(options.abbrevRef ? ['--abbrev-ref'] : []),
      ...(options.verify ? ['--verify'] : []),
      rev,
    ])
  }

  async show (rev: string, path: string) {
    try {
      return await this.exec('show', [`${rev}:${path}`])
    } catch (e) {
      if (String(e).includes(`exists on disk, but not in '${rev}'`)) {
        return undefined
      }

      throw e
    }
  }

  /** Creates a tag for the current commit. */
  async tag (options: GitTagOptions) {
    const { name, sign = false } = options

    let { message } = options

    if (sign) {
      message = ''
    }

    await this.exec('tag', [
      ...(sign ? ['-s'] : []),
      ...(message ? ['-a', '-m', message] : []),
      '--',
      name,
    ])
  }

  async exec (cmd: string, args: Arg[], options: SpawnOptionsWithoutStdio = {}) {
    return trim(await this.sh.exec('git', [cmd, ...args], options))
  }

  run (cmd: string, args: Arg[], options: SpawnOptionsWithoutStdio = {}) {
    return this.sh.run('git', [cmd, ...args], options)
  }
}

export class GitClient {
  private readonly git: GitCommander

  constructor (options: { cwd?: string, sh?: Runner } = {}) {
    this.git = new GitCommander(options)
  }

  get cmd () {
    return this.git
  }

  /** Commits stream. */
  commits<T = string> (options: GitLogOptions & {
    /** Pattern to filter commits. */
    ignore?: RegExp;
    parser?: (raw: string) => T;
  } = {}) {
    const {
      format = '%B',
      ignore,
      parser = (raw) => raw as T,
      ...rest
    } = options

    const separator = '------------------------ >8 ------------------------'
    const stdout = this.git.log({ ...rest, format: `${format}%n${separator}` }).split(`${separator}\n`)

    return new AsyncStream<T>((async function* () {
      for await (const chunk of stdout) {
        const raw = String(chunk)

        if (!ignore || !ignore.test(raw)) {
          yield parser(raw)
        }
      }
    })())
  }

  /** Tags stream. */
  tags () {
    const stdout = this.git.log({ order: ['date'], color: false, decorate: true })

    return new AsyncStream<string>((async function* () {
      let matches: IterableIterator<RegExpMatchArray>
      let tag: string

      for await (const chunk of stdout) {
        matches = trim(chunk).matchAll(/tag:\s*(.+?)[,)]/gi)

        for ([, tag] of matches) {
          yield tag
        }
      }
    })())
  }
}

function arraify<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value]
}

function trim (value: unknown): string {
  return String(value).trim()
}
