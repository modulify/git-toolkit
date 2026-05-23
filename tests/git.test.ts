import {
  GitClient,
  GitCommander,
} from '@/git'

import { TextStream } from '@/stream'

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest'

import { execSync } from 'node:child_process'

import {
  join,
  resolve,
} from 'node:path'

import { randomUUID } from 'node:crypto'

import fs from 'fs'
import { Readable } from 'stream'

const __temporary = join(__dirname, 'tmp')

const commitTypes = [
  'chore',
  'test',
  'ci',
  'feat',
  'refactor',
  'style',
  'docs',
]

describe('Client', () => {
  let git: GitClient
  let cwd: string

  const exec = (command: string) => execSync(command, {
    cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  })

  beforeAll(() => {
    cwd = join(__temporary, randomUUID())

    fs.mkdirSync(cwd, { recursive: true })
    fs.mkdirSync(resolve(cwd, 'git-templates'))

    exec('git init --template=./git-templates --initial-branch=main')
    exec('git config user.name "Tester"')
    exec('git config user.email "tester.modulify@gmail.com"')

    for (let i = 0; i < 20; i++) {
      const type = commitTypes[Math.round(Math.random() * (commitTypes.length - 1))]

      exec(`git commit -m "${type}: commit message for ${type} #${i}" --allow-empty --no-gpg-sign`)

      if (i % 3 === 0) {
        exec(`git tag v${i}.0.0`)
      }
    }

    git = new GitClient({ cwd })
  })

  afterAll(() => {
    try {
      if (cwd) {
        fs.rmSync(cwd, { recursive: true })
      }

      if (!fs.readdirSync(__temporary).length) {
        fs.rmdirSync(__temporary)
      }
    } catch { /* empty */ }
  })

  describe('commits', () => {
    it('gets commits', async () => {
      expect(await git.commits().arraify()).toMatchObject(
        expect.arrayContaining([expect.stringContaining(': ')])
      )
    })

    it('gets parsed commits', async () => {
      expect(await git.commits({
        parser: (raw) => ({ raw }),
      }).arraify()).toMatchObject(
        expect.arrayContaining([
          expect.objectContaining({ raw: expect.stringContaining(': ') }),
        ])
      )
    })

    it('honours `options.from`', async () => {
      const commits = await git.commits({ from: 'HEAD~1' }).arraify()

      expect(commits).toMatchObject(expect.arrayContaining([expect.stringContaining(': ')]))
      expect(commits).toHaveLength(1)
    })

    it('honours `options.to`', async () => {
      const commits = await git.commits({ to: 'HEAD^' }).arraify()

      expect(commits).toMatchObject(expect.arrayContaining([expect.stringContaining(': ')]))
      expect(commits).toHaveLength(19)
    })

    it('rejects option-like `options.from` revisions', async () => {
      const output = resolve(cwd, 'commits-from-output')

      await expect(async () => await git.commits({ from: `--output=${output}` }).arraify())
        .rejects.toThrow('from must not start with')
      expect(fs.existsSync(output)).toBe(false)
    })

    it('rejects option-like `options.to` revisions', async () => {
      const output = resolve(cwd, 'commits-to-output')

      await expect(async () => await git.commits({ to: `--output=${output}` }).arraify())
        .rejects.toThrow('to must not start with')
      expect(fs.existsSync(output)).toBe(false)
    })

    it('honours `options.format`', async () => {
      const commits = await git.commits({ format: 'what%n%B' }).arraify()

      expect(commits).toMatchObject(expect.arrayContaining(
        [expect.stringContaining('what\n'), expect.stringContaining(': ')]
      ))
    })

    it('allows commits to be scoped to a specific directory', async () => {
      fs.mkdirSync(resolve(cwd, './packages/foo'), { recursive: true })
      fs.writeFileSync(resolve(cwd, './packages/foo/test1'), '')

      exec('git add --all && git commit -m "feat(foo): add test1"')

      expect(await git.commits({ path: 'packages/foo' }).arraify()).toEqual([
        'feat(foo): add test1\n\n',
      ])
    })

    it('allows commits to be scoped to a list of directories', async () => {
      fs.mkdirSync(resolve(cwd, './packages/bar'), { recursive: true })
      fs.writeFileSync(resolve(cwd, './packages/bar/test1'), '')

      exec('git add --all && git commit -m "feat(bar): add test1"')

      expect(await git.commits({ path: ['packages/foo', 'packages/bar'] }).arraify()).toEqual([
        'feat(bar): add test1\n\n', 'feat(foo): add test1\n\n',
      ])
    })

    it('prevents variable expansion on Windows', async () => {
      expect(await git.commits({ format: '%%cd%n%B' }).arraify()).toMatchObject(expect.arrayContaining(
        [expect.stringContaining('%cd\n'), expect.stringContaining(': ')]
      ))
    })

    it('passes raw args', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const now = new Date()

      fs.writeFileSync(resolve(cwd, 'test2'), 'hello')

      exec('git add --all && git commit -m "chore: hello"')

      expect(await git.commits({ since: now }).arraify()).toEqual(['chore: hello\n\n'])
    })

    it('filters ignored commits', async () => {
      exec('git commit -m "docs: ignored commit" --allow-empty --no-gpg-sign')

      expect(await git.commits({ from: 'HEAD~1', ignore: /^docs:/ }).arraify()).toEqual([])
      expect(await git.commits({ from: 'HEAD~1', ignore: /^feat:/ }).arraify()).toEqual(['docs: ignored commit\n\n'])
    })
  })

  describe('tags', () => {
    it('gets tags list', async () => {
      expect(await git.tags().arraify()).toMatchObject(
        expect.arrayContaining([
          expect.stringMatching(/^v\d+\.\d+\.\d+$/),
        ])
      )
    })

    it('gets last tag', async () => {
      expect(await git.tags().first()).toBe('v18.0.0')
    })
  })

  describe('cmd', () => {
    it('gets current branch name', async () => {
      expect(await git.cmd.revParse('HEAD', { abbrevRef: true })).toBe('main')
    })

    it('verifies revs exist', async () => {
      await expect(git.cmd.revParse('v18.0.0', { verify: true })).resolves.toEqual(expect.stringMatching(/^[a-f0-9]{7,40}$/))
      await expect(git.cmd.revParse('v20.0.0', { verify: true })).rejects.toThrow()
    })

    it('rejects option-like rev-parse revisions', async () => {
      await expect(git.cmd.revParse('--output=/tmp/rev-parse-output')).rejects.toThrow('rev must not start with')
    })

    it('adds, commits, and shows files under specified rev', async () => {
      const __manifest = resolve(cwd, 'package.json')

      fs.writeFileSync(__manifest, JSON.stringify({
        name: 'pkg-name',
        description: 'pkg-description',
        license: 'MIT',
        version: '1.0.0',
        main: 'index.js',
      }, null, 2))

      await git.cmd.add([__manifest])
      await git.cmd.commit({ message: 'feat: Added package.json' })

      const parser = (raw: string) => {
        const [hash, ...message] = raw.split(' ')
        return { hash, message: message.join(' ').trim() }
      }

      const commit1 = await git.commits({
        format: '%H %B',
        parser,
      }).first()

      expect(commit1).toEqual(expect.objectContaining({
        hash: expect.stringMatching(/^[a-f0-9]{7,40}$/),
        message: 'feat: Added package.json',
      }))

      fs.writeFileSync(__manifest, JSON.stringify({
        name: 'pkg-name',
        description: 'pkg-description',
        license: 'MIT',
        version: '1.1.0',
        main: 'index.js',
      }, null, 2))

      await git.cmd.add([__manifest])
      await git.cmd.commit({ message: 'chore: Release v1.1.0' })
      await git.cmd.tag({ name: 'v1.1.0', message: 'Release v1.1.0' })

      const commit2 = await git.commits({
        format: '%H %B',
        parser,
      }).first()

      expect(commit2).toEqual(expect.objectContaining({
        hash: expect.stringMatching(/^[a-f0-9]{7,40}$/),
        message: 'chore: Release v1.1.0',
      }))

      expect(await git.cmd.show('v18.0.0', 'package.json')).toBe(undefined)

      expect(JSON.parse((await git.cmd.show(commit1!.hash, 'package.json')) ?? '{}')).toEqual(
        expect.objectContaining({ version: '1.0.0' })
      )

      expect(JSON.parse((await git.cmd.show(commit2!.hash, 'package.json')) ?? '{}')).toEqual(
        expect.objectContaining({ version: '1.1.0' })
      )

      await expect(git.cmd.show('HEAD', 'non-existent.txt')).rejects.toThrow()
    })

    it('rejects option-like show revisions', async () => {
      const output = resolve(cwd, 'show-output')

      await expect(git.cmd.show(`--output=${output}`, 'package.json')).rejects.toThrow('rev must not start with')
      expect(fs.existsSync(output)).toBe(false)
    })

    it('checks if file is ignored', async () => {
      fs.writeFileSync(resolve(cwd, '.gitignore'), 'ignored.txt\n')

      expect(await git.cmd.checkIgnore('ignored.txt')).toBe(true)
      expect(await git.cmd.checkIgnore('package.json')).toBe(false)
      expect(await git.cmd.checkIgnore(resolve(cwd, '..', 'package.json'))).toBe(false)
    })

    it('exposes default command cwd', () => {
      expect(new GitCommander().cwd).toBe(process.cwd())
      expect(new GitClient().cmd.cwd).toBe(process.cwd())
    })

    it('passes less common command options to git', async () => {
      const sh = new FakeRunner()
      const cmd = new GitCommander({ sh: sh as never })

      await cmd.commit({
        message: 'signed commit',
        verify: false,
        sign: true,
        files: ['package.json'],
      })

      cmd.log()
      cmd.log({
        since: '2024-01-01',
        reverse: true,
        merges: true,
        decorate: 'short',
        path: 'src',
      })
      cmd.log({ merges: false })

      await cmd.revParse('HEAD')
      await cmd.push('main')
      await cmd.tag({
        name: 'v1.2.3',
        sign: true,
        message: 'ignored for signed tags',
      })

      expect(sh.commands).toEqual([
        {
          cmd: 'git',
          args: ['commit', '--no-verify', '-S', '-m', 'signed commit', '--', 'package.json'],
        },
        {
          cmd: 'git',
          args: ['log', 'HEAD'],
        },
        {
          cmd: 'git',
          args: ['log', '--since=2024-01-01', '--reverse', '--merges', '--decorate=short', 'HEAD', '--', 'src'],
        },
        {
          cmd: 'git',
          args: ['log', '--no-merges', 'HEAD'],
        },
        {
          cmd: 'git',
          args: ['rev-parse', 'HEAD'],
        },
        {
          cmd: 'git',
          args: ['push', '--follow-tags', 'origin', '--', 'main'],
        },
        {
          cmd: 'git',
          args: ['tag', '-s', '--', 'v1.2.3'],
        },
      ])
    })

    it('rejects runtime-invalid log order values before spawning git', () => {
      const sh = new FakeRunner()
      const cmd = new GitCommander({ sh: sh as never })

      expect(() => cmd.log({ order: ['output=/tmp/git-output' as never] })).toThrow('order must be one of')
      expect(sh.commands).toEqual([])
    })

    it('rejects runtime-invalid log decorate values before spawning git', () => {
      const sh = new FakeRunner()
      const cmd = new GitCommander({ sh: sh as never })

      expect(() => cmd.log({ decorate: 'output=/tmp/git-output' as never })).toThrow('decorate must be boolean')
      expect(sh.commands).toEqual([])
    })

    it('rejects runtime-invalid log option types before spawning git', () => {
      const sh = new FakeRunner()
      const cmd = new GitCommander({ sh: sh as never })

      expect(() => cmd.log({ from: 1 as never })).toThrow('from must be a string')
      expect(() => cmd.log({ path: [1] as never })).toThrow('path[0] must be a string')
      expect(() => cmd.log({ order: 'date' as never })).toThrow('order must be an array')
      expect(() => cmd.log({ since: new Date('invalid') })).toThrow('since must be a string or valid Date')
      expect(sh.commands).toEqual([])
    })

    it('rejects runtime-invalid command values before spawning git', async () => {
      const sh = new FakeRunner()
      const cmd = new GitCommander({ sh: sh as never })

      await expect(cmd.add('package.json' as never)).rejects.toThrow('files must be an array')
      await expect(cmd.add([1] as never)).rejects.toThrow('files[0] must be a string')
      await expect(cmd.checkIgnore(1 as never)).rejects.toThrow('file must be a string')
      await expect(cmd.commit(null as never)).rejects.toThrow('options must be an object')
      await expect(cmd.commit({ message: 1 } as never)).rejects.toThrow('message must be a string')
      await expect(cmd.commit({ message: 'commit', sign: 'yes' } as never)).rejects.toThrow('sign must be a boolean')
      await expect(cmd.push(1 as never)).rejects.toThrow('branch must be a string')
      await expect(cmd.revParse(1 as never)).rejects.toThrow('rev must be a string')
      await expect(cmd.revParse('HEAD', { verify: 'yes' } as never)).rejects.toThrow('verify must be a boolean')
      await expect(cmd.show('HEAD', 1 as never)).rejects.toThrow('path must be a string')
      await expect(cmd.tag({ name: 1 } as never)).rejects.toThrow('name must be a string')
      await expect(cmd.tag({ name: 'v1.2.3', message: 1 } as never)).rejects.toThrow('message must be a string')

      expect(sh.commands).toEqual([])
    })

    it('rejects runtime-invalid commits options before spawning git', async () => {
      const sh = new FakeRunner()
      const client = new GitClient({ sh: sh as never })

      expect(() => client.commits(null as never)).toThrow('options must be an object')
      expect(() => client.commits({ ignore: 'docs' as never })).toThrow('ignore must be a RegExp')
      expect(() => client.commits({ parser: 'parse' as never })).toThrow('parser must be a function')

      expect(sh.commands).toEqual([])
    })
  })
})

class FakeRunner {
  readonly cwd = '/fake/project'
  readonly commands: Array<{ cmd: string, args: unknown[] }> = []

  async exec(cmd: string, args: unknown[]) {
    this.commands.push({ cmd, args })

    return ''
  }

  run(cmd: string, args: unknown[]) {
    this.commands.push({ cmd, args })

    return new TextStream(Readable.from([]))
  }
}
