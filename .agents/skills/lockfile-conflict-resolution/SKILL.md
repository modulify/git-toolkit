---
name: lockfile-conflict-resolution
description: Use this skill when resolving merge/rebase conflicts in package-manager lockfiles. It standardizes taking the target-branch lockfile as baseline, regenerating it with the repository package manager, and keeping manifest/package-manager metadata aligned.
---

# Lockfile Conflict Resolution

## When To Use
Use this skill when:
- a package-manager lockfile has merge or rebase conflicts;
- dependency manifests changed near a lockfile conflict;
- package-manager metadata changed, such as checked-in Yarn releases or `packageManager`;
- repeated conflict rounds happen during one rebase or merge.

Common lockfiles include:
- `yarn.lock`
- `package-lock.json`
- `pnpm-lock.yaml`
- `npm-shrinkwrap.json`
- `bun.lock` / `bun.lockb`

## Repository Notes
- This repository currently uses Yarn Berry.
- The active lockfile is `yarn.lock`.
- `.yarnrc.dist.yml` is tracked; `.yarnrc.yml` is generated locally by `make pnp`.
- Yarn releases are checked in under `.yarn/releases/**`.
- Keep `.yarnrc.dist.yml`, `.yarn/releases/**`, `package.json#packageManager`, and `yarn.lock` aligned when Yarn itself changes.

## Source Of Truth Policy
- During rebase, take the lockfile from the branch being rebased onto.
- During merge, take the lockfile from the current target branch (`HEAD`).
- After taking the baseline, run the repository package manager to regenerate/reconcile the lockfile from manifests.
- Do not manually edit conflict markers in lockfiles.
- For repeated conflict rounds, reuse the previous successful lockfile resolution as the new base.
- Exception: if the current change intentionally updates dependencies or the package manager, replay that intent after resolving the baseline lockfile.

## Detect Package Manager
Prefer explicit repository configuration over guessing:
- `packageManager` in `package.json`
- checked-in manager files such as `.yarnrc.yml`, `.yarnrc.dist.yml`, `.npmrc`, `pnpm-workspace.yaml`
- existing lockfile names

For this repository, use Yarn commands unless the project is intentionally migrated.

## Regeneration Commands
Use the command matching the active package manager:
- Yarn: `yarn install`
- npm: `npm install --package-lock-only` when only regenerating the lockfile; `npm install` when dependencies must be installed too
- pnpm: `pnpm install --lockfile-only` when only regenerating the lockfile; `pnpm install` when dependencies must be installed too
- Bun: `bun install`

## Workflow
1. Confirm the conflict and identify the lockfile:
```bash
git status --short
```
2. First conflict round during rebase:
```bash
ONTO=$(cat .git/rebase-merge/onto 2>/dev/null || cat .git/rebase-apply/onto)
git show "$ONTO:<lockfile>" > <lockfile>
<package-manager install command>
git add <lockfile>
cp <lockfile> .git/lockfile-resolution-base
```
3. First conflict round during merge:
```bash
git show "HEAD:<lockfile>" > <lockfile>
<package-manager install command>
git add <lockfile>
cp <lockfile> .git/lockfile-resolution-base
```
4. Repeated conflict rounds:
```bash
cp .git/lockfile-resolution-base <lockfile>
<package-manager install command>
git add <lockfile>
cp <lockfile> .git/lockfile-resolution-base
```
5. Continue:
```bash
git rebase --continue
# or
git merge --continue
```
6. Cleanup after the operation:
```bash
rm -f .git/lockfile-resolution-base
```

## Manifest And Tooling Alignment
When dependency or package-manager files changed, stage the full coherent set:
- lockfile;
- dependency manifests such as `package.json`;
- package-manager config such as `.yarnrc.dist.yml`, `.npmrc`, or `pnpm-workspace.yaml`;
- checked-in package-manager binaries/releases when the repository uses them.

For Yarn updates in this repository, verify:
- `package.json#packageManager`
- `.yarnrc.dist.yml`
- `.yarn/releases/yarn-*.cjs`
- `yarn.lock` metadata

## Validation
- `git status --short` must not show unresolved lockfile conflicts.
- The package-manager install/regeneration command must complete.
- The lockfile and any matching manifest/tooling files must be staged before `--continue`.
- Do not commit unrelated generated files from the package manager.
