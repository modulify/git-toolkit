# AGENTS.md

## Goals
- Avoid clarification loops by proposing a concrete interpretation when details
  are missing.
- Default to the language of the user's initial message unless they explicitly
  request a different language.
- Match the tone and formality of the user's initial message unless they
  explicitly ask for a change.
- Treat a language switch in the user's message as an explicit request to
  respond in that language.
- If a message is mixed-language, reply in the dominant language unless the
  user specifies otherwise.
- Run `make eslint` before handoff or commit preparation only when changed
  files include code covered by eslint rules (for example `*.js`, `*.ts`,
  and similar source files). Do not run `make eslint` for markdown-only
  changes (for example `*.md`).
- Getter/helper functions must be side-effect free. Side effects are allowed
  only by prior agreement and only when there are strong, explicit reasons.

## Reporting
- Keep handoff reports natural and outcome-focused: describe what was done.
- Do not proactively list skipped optional steps/checks (for example, not
  running eslint for markdown-only changes) unless the user explicitly asks.
- Always mention blockers, failed required checks, or other omissions that can
  affect correctness, safety, or reproducibility.

## Purpose
This file defines practical instructions for working in the
`modulify/git-toolkit` repository, with a focus on test execution, coverage,
dependency updates, and commit workflow.

## Repository Structure
- This project is a single-package TypeScript library.
- Package name: `@modulify/git-toolkit`.
- Source files live in `src/`.
- Tests live in `tests/`.
- Public helper types live in `types/`.
- Library build output is generated into `dist/`.
- The project uses Yarn Berry with Plug'n'Play.

## Local Environment Prerequisites
- Node.js version is `>=20.0.0` (see `engines` in `package.json`).
- Yarn version is `4.15.0` (see `packageManager` in `package.json` and
  `yarnPath` in `.yarnrc*.yml`).
- Local `.yarnrc.yml` is generated from `.yarnrc.dist.yml` using:
```bash
make .yarnrc.yml
```
- Local `.env` is generated from `.env.dist` using:
```bash
make .env
```
- The `.env` file is required for Docker Compose based recipes such as
  `make actionlint`, because it sets `COMPOSE_FILE`.
- Install dependencies and prepare the PnP loader file with:
```bash
make pnp
```

## Running Tests

### Local Path
- Generate local Yarn config:
```bash
make .yarnrc.yml
```
- Install dependencies:
```bash
make pnp
```
- Run all tests:
```bash
make test
```

### Coverage
- Run tests with coverage:
```bash
make test
```
- Generate an HTML coverage report:
```bash
make test report=html
```
- Coverage is expected to stay at 100% for statements, branches, functions,
  and lines unless the user explicitly accepts a different target.

## Related Commands
- Build the package:
```bash
make build
```
- Run eslint:
```bash
make eslint
```
- Run GitHub Actions workflow linting:
```bash
make actionlint
```
- Show available Makefile recipes:
```bash
make help
```

## Important Project Rules
- Commit messages follow Conventional Commits.
- Keep `task.md`, scratch notes, and local investigation files out of commits
  unless the user explicitly asks.
- Getter/helper functions must be side-effect free. Side effects are allowed
  only by prior agreement and only when there are strong, explicit reasons.
- When updating dependencies, keep `package.json` and `yarn.lock` together in
  the same logical tooling/dependency commit.
- For lockfile conflicts, adapt the resolution to the lockfile in question;
  do not assume the workflow is Yarn-specific unless `yarn.lock` is the file
  being resolved.

## Commit Workflow
- Default commit message language is English unless explicitly requested
  otherwise.
- Commit style is Conventional Commits.
- Prefer no scope unless a future repository policy introduces stable scopes.
- Write commit subjects as historical facts, not intentions.
- Start commit subject description with an uppercase letter.
- Keep commit subject description concise.
- Move long details to the commit body; lists in the body are allowed for
  enumerations.
- Use past/perfective wording; prefer passive voice for changelog-friendly
  phrasing.
Examples: `Added ...`, `Removed ...`, `Refactored ...`, `Fixed ...`.
- Split commits by logical change.
- Keep runtime/library behavior changes separate from tooling, Yarn, release,
  or generated-output changes when they can be reviewed or reverted
  independently.
- Commit lockfile/package-manager changes with the manifest/tooling change
  that caused them.
- If only `yarn.lock` changed after a plain install, use:
`chore: Updated yarn.lock`.
- For commit tasks, use the local skill:
`.agents/skills/commit-workflow/SKILL.md`.
- For lockfile merge/rebase conflict resolution, use the local skill:
`.agents/skills/lockfile-conflict-resolution/SKILL.md`.
- For coverage deficit analysis and recovery strategy, use the local skill:
`.agents/skills/coverage-recovery/SKILL.md`.

## Build And Type Declarations
- Vite builds both ESM and CJS library outputs.
- Type declarations are generated by `unplugin-dts` via
  `unplugin-dts/vite`.
- After changing build config, exports, or declaration-generation behavior,
  run:
```bash
make build
```
