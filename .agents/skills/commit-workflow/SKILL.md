---
name: commit-workflow
description: Use this skill when creating git commits in this repository. It standardizes commit splitting, Conventional Commit type selection, English commit message text, dependency/Yarn update separation, and final verification.
---

# Commit Workflow

## When To Use
Use this skill when the user asks to:
- create one or more commits;
- split changes into separate commits;
- choose commit messages, scopes, or types;
- validate commit formatting before committing.

## Repository Shape
- This is a single-package TypeScript library, not a multi-workspace repository.
- There is no commitlint config in this repository today.
- Prefer no scope unless a future repository policy introduces stable scopes.
- Keep `task.md`, scratch notes, and local investigation files out of commits unless the user explicitly asks.

## Commit Rules
- Use Conventional Commit headers.
- Message language: English by default.
- Allowed types: `feat`, `fix`, `build`, `ci`, `perf`, `docs`, `refactor`, `style`, `test`, `chore`.
- Keep the subject concise and describe the completed change.
- Use a body when the reason or validation matters.
- Do not mix unrelated changes in one commit.
- Keep behavior/runtime changes separate from tooling, Yarn, release, or generated-output changes when they can be reviewed or reverted independently.
- Commit lockfile/package-manager changes with the manifest/tooling change that caused them.
- If only `yarn.lock` changed after a plain install, use `chore: Update yarn.lock`.

## Workflow
1. Inspect pending changes:
```bash
git status --short
git diff
```
2. Group changes by intent:
- runtime/library behavior under `src/**`;
- tests under `tests/**` that prove the same runtime change;
- tooling/package-manager files such as `.yarn/**`, `.yarnrc.dist.yml`, `package.json`, `yarn.lock`;
- documentation such as `README.md` and `CHANGELOG.md`.
3. Stage only the files for one intent:
```bash
git add <files>
```
4. Create a non-interactive commit:
```bash
git commit -m "<type>: <description>"
```
5. Verify the resulting commit:
```bash
git show --name-status --oneline -n 1
git status --short
```

## Practical Patterns
- Runtime bugfix with proving tests: `fix: Close streams on early return`
- Test-only change: `test: Cover stream cancellation`
- Yarn/tooling refresh: `chore: Update Yarn to 4.15.0`
- Build config change: `build: Update package exports`
- Documentation change: `docs: Update README usage examples`
