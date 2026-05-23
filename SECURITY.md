# Security Policy

## Supported Versions

`@modulify/git-toolkit` is currently pre-1.0. Security fixes are provided for
the latest published version and the `main` branch.

| Version | Supported |
| ------- | --------- |
| latest npm version | Yes |
| `main` branch | Yes |
| older versions | No |

Older versions may receive a fix only when there is a clear practical need and
maintainer capacity to backport safely.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Preferred reporting path:

1. Open a private GitHub security advisory:
   https://github.com/modulify/git-toolkit/security/advisories/new
2. If GitHub private reporting is unavailable, email:
   zaytsev.cmath10@gmail.com

Please include as much detail as possible:

* affected package version or commit SHA;
* affected API or command path;
* minimal reproduction steps;
* expected and actual behavior;
* impact assessment;
* whether the issue is already public.

## Scope

Security reports are especially useful when they involve:

* Git argument injection;
* shell or command execution bypasses;
* unsafe path, revision, branch, tag, or config handling;
* arbitrary file read/write through Git command construction;
* unbounded memory use in output helpers or streams;
* dependency vulnerabilities that affect this package in a reachable way;
* secret exposure in logs, errors, or workflow output.

Out of scope:

* social engineering;
* physical attacks;
* denial of service against public infrastructure not controlled by this
  project;
* findings that require already-compromised maintainer credentials;
* vulnerabilities in dependencies that are not reachable through this package.

## Disclosure Process

Reports are reviewed as maintainer capacity allows. The expected process is:

1. Acknowledge the report.
2. Reproduce and assess impact.
3. Prepare a fix and tests.
4. Publish a patched npm release when needed.
5. Coordinate public disclosure through a GitHub advisory, changelog entry, or
   release notes.

Please give maintainers reasonable time to investigate and release a fix before
public disclosure.

## Security Design Notes

This package treats Git CLI execution as a security boundary.

The intended direction is:

* command execution through argv arrays, not shell strings;
* no shell mode in the public runner;
* explicit validation for high-level Git options;
* careful separation of revisions, options, and paths;
* bounded output helpers for full-output collection;
* streaming APIs for larger Git output.

Low-level `exec()` and `run()` APIs are available as escape hatches, but callers
must not pass untrusted input to them without validation.
