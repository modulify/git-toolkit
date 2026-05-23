import type { Arg } from '~types/arg'

import type {
  GitCommitOptions,
  GitLogOptions,
  GitRevParseOptions,
  GitTagOptions,
} from '~types/git'

import { AsyncStream } from '@/stream'
import {
  Runner,
  type RunnerOptions,
} from './shell'

const orders = ['author-date', 'date', 'topo']
const decorations = ['short', 'full', 'auto', 'no']

export class GitCommander {
  private readonly sh: Runner

  constructor (options: { cwd?: string, sh?: Runner } = {}) {
    this.sh = options.sh ?? new Runner(options.cwd)
  }

  get cwd () {
    return this.sh.cwd
  }

  /** Add files to a git index. */
  async add (files: string[]) {
    assertStringArray(files, 'files')

    await this.exec('add', ['--', ...files])
  }

  /** Check a file is ignored via .gitignore. */
  async checkIgnore(file: string) {
    assertString(file, 'file')

    try {
      return Boolean(await this.exec('check-ignore', ['--', file]))
    } catch {
      return false
    }
  }

  /** Commit changes. */
  async commit (options: GitCommitOptions) {
    assertRecord(options, 'options')
    assertString(options.message, 'message')
    assertOptionalBoolean(options.sign, 'sign')
    assertOptionalBoolean(options.verify, 'verify')
    assertOptionalStringArray(options.files, 'files')

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
    assertRecord(options, 'options')

    const {
      from = '',
      to = 'HEAD',
      since,
      order = [],
      color = true,
      decorate,
    } = options
    assertSafeRevision(from, 'from')
    assertSafeRevision(to, 'to')
    assertOptionalString(options.format, 'format')
    assertSince(since, 'since')
    assertOrders(order)
    assertDecoration(decorate)
    assertPath(options.path, 'path')
    assertOptionalBoolean(options.reverse, 'reverse')
    assertOptionalBoolean(options.merges, 'merges')
    assertOptionalBoolean(color, 'color')

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
    assertString(branch, 'branch')

    await this.exec('push', ['--follow-tags', 'origin', '--', branch])
  }

  async revParse (rev: string, options: GitRevParseOptions = {}) {
    assertSafeRevision(rev, 'rev')
    assertRecord(options, 'options')
    assertOptionalBoolean(options.abbrevRef, 'abbrevRef')
    assertOptionalBoolean(options.verify, 'verify')

    return await this.exec('rev-parse', [
      ...(options.abbrevRef ? ['--abbrev-ref'] : []),
      ...(options.verify ? ['--verify'] : []),
      rev,
    ])
  }

  async show (rev: string, path: string) {
    assertSafeRevision(rev, 'rev')
    assertString(path, 'path')

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
    assertRecord(options, 'options')
    assertString(options.name, 'name')
    assertOptionalString(options.message, 'message')
    assertOptionalBoolean(options.sign, 'sign')

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

  async exec (cmd: string, args: Arg[], options: RunnerOptions = {}) {
    return trim(await this.sh.exec('git', [cmd, ...args], options))
  }

  run (cmd: string, args: Arg[], options: RunnerOptions = {}) {
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
    assertRecord(options, 'options')
    assertOptionalRegExp(options.ignore, 'ignore')
    assertOptionalFunction(options.parser, 'parser')

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

function assertRecord(value: unknown, name: string) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`)
  }
}

function assertString(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string`)
  }
}

function assertOptionalString(value: unknown, name: string): asserts value is string | undefined {
  if (value !== undefined) {
    assertString(value, name)
  }
}

function assertBoolean(value: unknown, name: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${name} must be a boolean`)
  }
}

function assertOptionalBoolean(value: unknown, name: string): asserts value is boolean | undefined {
  if (value !== undefined) {
    assertBoolean(value, name)
  }
}

function assertStringArray(value: unknown, name: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`)
  }

  for (const [index, item] of value.entries()) {
    assertString(item, `${name}[${index}]`)
  }
}

function assertOptionalStringArray(value: unknown, name: string): asserts value is string[] | undefined {
  if (value !== undefined) {
    assertStringArray(value, name)
  }
}

function assertSafeRevision(value: unknown, name: string): asserts value is string {
  assertString(value, name)

  if (value.startsWith('-')) {
    throw new Error(`${name} must not start with '-'`)
  }
}

function assertOrders(order: unknown) {
  if (!Array.isArray(order)) {
    throw new Error('order must be an array')
  }

  for (const value of order) {
    if (!orders.includes(value as never)) {
      throw new Error(`order must be one of: ${orders.join(', ')}`)
    }
  }
}

function assertPath(path: unknown, name: string) {
  if (path === undefined) {
    return
  }

  if (Array.isArray(path)) {
    for (const [index, item] of path.entries()) {
      assertString(item, `${name}[${index}]`)
    }

    return
  }

  assertString(path, name)
}

function assertSince(value: unknown, name: string) {
  if (value === undefined || typeof value === 'string') {
    return
  }

  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return
  }

  throw new Error(`${name} must be a string or valid Date`)
}

function assertOptionalRegExp(value: unknown, name: string) {
  if (value !== undefined && !(value instanceof RegExp)) {
    throw new Error(`${name} must be a RegExp`)
  }
}

function assertOptionalFunction(value: unknown, name: string) {
  if (value !== undefined && typeof value !== 'function') {
    throw new Error(`${name} must be a function`)
  }
}

function assertDecoration(decorate: unknown) {
  if (typeof decorate === 'boolean' || decorate === undefined) {
    return
  }

  if (!decorations.includes(decorate as never)) {
    throw new Error(`decorate must be boolean or one of: ${decorations.join(', ')}`)
  }
}
