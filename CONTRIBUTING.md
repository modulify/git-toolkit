# Contributing

[Code of Conduct](./CODE_OF_CONDUCT.md)

Thanks for contributing to `@modulify/git-toolkit`.

This document describes our expectations for contribution quality. We keep a
high engineering bar in this repository and expect the same level of discipline
from every contribution.

## Repository Context

`@modulify/git-toolkit` is a single-package TypeScript library for Git command
execution helpers, shell execution helpers, and stream utilities.

Important project boundaries:

* Source files live in `src/`.
* Tests live in `tests/`.
* Public helper types live in `types/`.
* Build output is generated into `dist/` and should not be edited manually.
* The project uses Yarn Berry with Plug'n'Play.

Changes are expected to stay well-scoped and logically separated.

## Local Setup

Before working on changes, prepare local Yarn configuration and dependencies:

```bash
make .yarnrc.yml
make pnp
```

For Docker Compose based recipes, such as GitHub Actions workflow linting,
generate local environment configuration:

```bash
make .env
```

## Quality Expectations

Before handoff or PR, we expect the contribution to pass the checks relevant to
the files changed:

Tests and coverage:

```bash
make test
```

Build:

```bash
make build
```

Eslint when changed files include linted code (`*.ts`, `*.js`, etc.):

```bash
make eslint
```

GitHub Actions workflow linting when `.github/**` workflow or action files
changed:

```bash
make actionlint
```

Coverage thresholds are strict and enforced in configuration:

* `100%` statements
* `100%` branches
* `100%` functions
* `100%` lines

External contributions that reduce coverage quality are not accepted.

## Definition of Done

A contribution is considered done when all points below are satisfied:

* The change is scoped clearly to the intended behavior.
* Required checks pass for the changed files.
* Public API behavior is covered by tests.
* Documentation is updated when behavior or public API changed.
* Commits are split by logical intent.

## Coverage Philosophy

Coverage in this repository is a quality gate, not a vanity metric.

For external contributions, we expect this order of work:

1. Cover real public API scenarios first.
2. Add missing realistic scenarios that were overlooked.
3. Treat remaining uncovered code as a quality signal:
   * potential bug source,
   * redundant/dead logic,
   * architecture smell.
4. Add controlled failure scenarios for defensive branches.
5. Prefer removing redundant logic or improving architecture over artificial
   tests for impossible paths.
6. If real-world coverage already includes both normal and failure public API
   flows, but total coverage is still below `100%`, treat it as a design flaw
   and/or a bug, not as a reason to add synthetic edge-case tests just to
   satisfy the metric.

This philosophy is codified for local AI agents in:

* `.agents/skills/coverage-recovery/SKILL.md`

## Practical Advice For AI Pairing

When working with AI agents in this repository, do not make your agents walk in
circles.

If progress stalls after reasonable attempts, ask for escalation instead of
another brute-force pass:

1. Request an exact report of uncovered paths and why they remain.
2. Ask for concrete options and tradeoffs:
   * keep defensive code and accept the gap,
   * refactor architecture for testability,
   * remove redundant/impossible branches.
3. Make the architecture decision explicitly before continuing.

Final decisions on controversial architectural tradeoffs remain with the human
developer.

## Flaky Tests

Flaky tests are not acceptable in external contributions.

* Do not submit known flaky behavior.
* Do not mark unstable behavior as acceptable because coverage passes.
* Stabilize the scenario before expecting review or merge.

## PR Checklist

Before opening or updating a PR, verify:

* [ ] Scope is correct and module boundaries are respected.
* [ ] Public API behavior is covered by tests.
* [ ] `make test` passes.
* [ ] `make build` passes.
* [ ] `make eslint` passes when linted code files were changed.
* [ ] `make actionlint` passes when GitHub Actions files were changed.
* [ ] Related docs are updated.
* [ ] Commit messages follow repository conventions.

## Commit Rules

We expect all commits to follow repository conventions:

* Conventional Commits format.
* English commit messages by default.
* Completed historical wording that is concise and changelog-friendly.
* No scope unless a future repository policy introduces stable scopes.
* Logical split by intent.
* Keep runtime/library behavior changes separate from tooling, Yarn, release,
  or generated-output changes when they can be reviewed independently.
* Keep `task.md`, scratch notes, and local investigation files out of commits
  unless explicitly requested.
* Commit lockfile/package-manager changes with the manifest/tooling change
  that caused them.
* If only `yarn.lock` changed after a plain install, use:
  `chore: Updated yarn.lock`.

For detailed local commit flow:

* `.agents/skills/commit-workflow/SKILL.md`
