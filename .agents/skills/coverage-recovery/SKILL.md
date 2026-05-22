---
name: coverage-recovery
description: Use this skill when coverage is below target or when uncovered src code in this repository must be analyzed and resolved with minimal artificial tests.
---

# Coverage Recovery

## When To Use
Use this skill when the user asks to:
- increase test coverage;
- analyze uncovered lines or branches;
- enforce or discuss coverage thresholds;
- explain why specific uncovered paths remain.

## Source Of Truth
- `vitest.config.ts`
- `package.json`
- `Makefile`
- reports under `coverage/**` after coverage runs

## Repository Notes
- Coverage is configured for `src/**` with Istanbul.
- Public behavior is exposed by `src/stream.ts`, `src/shell.ts`, and `src/git.ts`.
- Shell/Git behavior often needs real child-process tests; prefer short-lived deterministic commands.
- Some git tests require local shell/git execution and may need to run outside restricted sandbox environments.

## Principles
- Coverage is a quality signal, not a vanity metric.
- Start from real public API behavior.
- Prefer tests that prove consumer-visible stream, shell, and Git contracts.
- Do not add synthetic tests only to execute implementation details.
- Remove dead or redundant branches when coverage shows unreachable code.
- Escalate with concrete options instead of looping on unnatural cases.

## Workflow
1. Collect facts:
```bash
make test-coverage
```
If the environment blocks shell/git execution, retry the relevant command outside the sandbox.
2. Read uncovered details, not only percentages:
- `coverage/coverage-final.json`
- HTML report under `coverage/**`
3. Classify uncovered paths:
- real public behavior gap;
- defensive path for process, stream, or Git failures;
- dead or redundant branch;
- hard-to-test design smell.
4. Resolve in this order:
- add/adjust tests for real API scenarios;
- add controlled failure tests for defensive branches;
- simplify or remove dead branches;
- propose a small refactor for design smells.
5. Re-run checks:
```bash
make eslint
make test-coverage
```

## Controlled Failure Patterns
- Empty async streams and early stream cancellation.
- Child process spawn failure.
- stderr-producing command failure.
- Git command failure in a temporary repository.
- Parser callbacks for commit/tag stream helpers.

## Stop Condition
If progress stalls:
1. Stop adding artificial tests.
2. Report exact uncovered locations and why they are hard or unnatural.
3. Offer a clear choice:
- accept the defensive path as uncovered;
- refactor to make the behavior testable;
- remove the redundant code.
