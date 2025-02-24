# Git toolkit

Git command runner & client for interacting with git repositories.

[![npm version](https://img.shields.io/npm/v/@modulify/git-toolkit.svg)](https://www.npmjs.com/package/@modulify/git-toolkit)
[![Tests Status](https://github.com/modulify/git-toolkit/actions/workflows/tests.yml/badge.svg)](https://github.com/modulify/git-toolkit/actions)
[![codecov](https://codecov.io/gh/modulify/git-toolkit/branch/main/graph/badge.svg)](https://codecov.io/gh/modulify/git-toolkit)

## Description

This package provides a reworked version of [@conventional-changelog/git-client](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/git-client)
without conventional git client logic.

## Install

```bash
# Using yarn
yarn add @modulify/git-toolkit

# Using npm
npm install @modulify/git-toolkit
```

---

## Requirements

- **Node.js**: `>=20.0.0`

## Usage

GitCommander:

```typescript
import { GitCommander } from '@modulify/git-client'

const git = new GitCommander()

await git.add('package.json')
await git.commit({ message: 'chore: release v1.0.0' })
await git.tag({ name: 'v1.0.0' })
await git.push('main')
```

GitClient:

```typescript
import { GitClient } from '@modulify/git-client'

const git = new GitClient()

for await (const commit in git.commits()) {
  console.log(commit)
}

for await (const tag in git.tags()) {
  console.log(tag)
}
```

## API

### `GitCommander`

The `GitCommander` class provides a set of methods to interact with Git functionality programmatically.
It wraps basic Git commands with support for advanced options.

#### Constructor
``` typescript
constructor(options: { cwd?: string, sh?: Runner } = {})
```
- **options** _(optional)_:
    - `cwd` _(string)_: The current working directory for Git operations.
    - `sh` _(Runner)_: An optional custom shell runner instance. If not provided, a new instance of the `Runner` class is created.

#### Properties
- `cwd`: _(string)_ - Returns the current working directory (`cwd`) used by the `Runner` instance.

#### Methods
1. `add(files: string[]): Promise<void>`
    - Adds the specified files to the Git index.
    - **parameters**:
        - `files`: _(string[])_ - List of file paths to stage.

2. `checkIgnore(file: string): Promise<boolean>`
    - Checks if a file is ignored via `.gitignore`.
    - **parameters**:
        - `file`: _(string)_ - The file path to check.

    - **returns**: _(boolean)_ - `true` if the file is ignored, otherwise `false`.

3. `commit(options: GitCommitOptions): Promise<void>`
    - Commits changes with the specified options.
    - **parameters**:
        - `options`: _(GitCommitOptions)_ - Object with commit options. Includes:
            - `message`: _(string)_ - Commit message.
            - `sign`: _(boolean)_ _(optional)_ - Sign the commit.
            - `files`: _(string[])_ _(optional)_ - List of file paths to commit.
            - `verify`: _(boolean)_ _(optional, default: true)_ - Whether to verify the commit.

4. `log(options?: GitLogOptions): string`
    - Retrieves the Git log with the specified options.
    - **parameters**:
        - `options`: _(GitLogOptions)_ _(optional)_ - Object with options such as `from`, `to`, `since`, `order`, etc.

    - **returns**: _(string)_ - The `git log` output.

5. `push(branch: string): Promise<void>`
    - Pushes changes to the remote repository for the specified branch.
    - **parameters**:
        - `branch`: _(string)_ - The branch to push.

6. `revParse(rev: string, options?: GitRevParseOptions): Promise<string>`
    - Resolves a Git revision to a specific commit ID.
    - **parameters**:
        - `rev`: _(string)_ - The revision to parse.
        - `options`: _(GitRevParseOptions)_ _(optional)_ - Additional options such as `abbrevRef` and `verify`.

7. `show(rev: string, path: string): Promise<string | undefined>`
    - Shows the content of a file in a specific revision.
    - **parameters**:
        - `rev`: _(string)_ - The revision to show.
        - `path`: _(string)_ - The file path.

    - **returns**: _(string | undefined)_ - The file's content or `undefined` if it doesn't exist in the revision.

8. `tag(options: GitTagOptions): Promise<void>`
    - Creates a tag for the current commit.
    - **parameters**:
        - `options`: _(GitTagOptions)_ - Tagging options, including `name`, `sign`, and `message`.

9. `exec(cmd: string, args: Arg[], options?: SpawnOptionsWithoutStdio): Promise<string>`
    - Executes a raw Git command.
    - **parameters**:
        - `cmd`: _(string)_ - The Git command to execute.
        - `args`: _(Arg[])_ - Arguments for the command.
        - `options`: _(SpawnOptionsWithoutStdio)_ _(optional)_ - Shell execution options.

10. `run(cmd: string, args: Arg[], options?: SpawnOptionsWithoutStdio): TextStream`
    - Runs a Git command (lower-level than `exec()`).
    - **parameters**:
        - `cmd`, `args`, `options`: Same as `exec()`.
    - **returns**: _(TextStream)_ - The command's output stream, where each chunk is string.

### `GitClient`

The `GitClient` class extends the functionality of the `GitCommander` and provides
additional utilities for working with Git data as streams.

#### Constructor

``` typescript
constructor(options: { cwd?: string, sh?: Runner } = {})
```

- **options** _(optional)_:
    - `cwd` _(string)_: The current working directory for Git operations.
    - `sh` _(Runner)_: An optional custom shell runner instance.

#### Properties
- `cmd`: _(GitCommander)_ – The `GitCommander` instance used by the client.

#### Methods
1. `commits<T = string>(options?: GitLogOptions & { ignore?: RegExp, parser?: (raw: string) => T }): AsyncStream<T>`
    - Retrieves a stream of Git commits based on the specified options.
    - **parameters**:
        - `options` _(optional)_ – extends `GitLogOptions` with following:
            - `ignore`: _(RegExp)_ _(optional)_ – A pattern to filter out unwanted commits.
            - `parser`: _(function)_ _(default: returns raw string)_ – A custom parser for each commit.
              Provides opportunity to transform raw commits to any form needed.

    - **returns**: _(AsyncStream)_ – Stream of parsed commit data.

2. `tags(): AsyncStream<string>`
    - Retrieves a stream of Git tags sorted by date.
    - **returns**: _(AsyncStream)_ – Stream of Git tags.
