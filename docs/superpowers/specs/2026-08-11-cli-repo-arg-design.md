# Design: CLI repo argument for label sync

**Date:** 2026-08-11  
**Status:** Approved for implementation planning  
**Goal:** Sync labels to a new GitHub repo without editing `labels.config.json` each time.

## Problem

Today, adding a repo means opening `labels.config.json`, appending to `repositories`, then running sync. Labels are already shared across the user’s repos; only the target repo name changes.

## Decision

**Approach:** CLI argument for one or more repo names. Config keeps `owner` + `labels`; `repositories` remains for batch mode when no CLI targets are given.

Out of scope: `--all` via GitHub API, global bin/`npx`, detecting repo from `git remote`, writing CLI names back into the JSON.

## CLI

| Command | Targets |
|---------|---------|
| `npm run sync -- <repo>` | Only that repo |
| `npm run sync` | All names in `repositories` |
| `node sync.mjs [config.json] [repo…]` | Same rules; first arg is config only if it ends with `.json` |

Examples:

```bash
npm run sync -- my-new-repo
npm run sync -- repo-a repo-b
npm run sync
node sync.mjs labels.config.json my-new-repo
```

## Target resolution

1. Load config (`owner`, `labels`, `repositories`).
2. If CLI provides one or more repo names → those are the targets.
3. Else → use `repositories` from JSON; error if empty/missing.
4. Accept `repo` or `owner/repo`. If `owner/repo` is used, `owner` must match `config.owner`.

Label create/update/delete behavior in `syncRepo` stays unchanged.

## Files

| File | Change |
|------|--------|
| `sync.mjs` | Parse argv; resolve targets; keep existing Octokit/sync logic |
| `README.md` | Document CLI repo usage and batch fallback |
| `labels.config.example.json` | Keep `repositories` for batch; no structural break |
| `package.json` | No script change required (`npm run sync -- <repo>`) |

## Errors

- Missing `GITHUB_TOKEN` — unchanged.
- Invalid config / empty `labels` — unchanged.
- No CLI repos and empty `repositories` — error: provide JSON list or pass repo name(s) on CLI.
- `owner/repo` with mismatched owner — explicit error.
- Missing repo / insufficient permissions — Octokit failure as today.

## Success criteria

- New repo: run `npm run sync -- <name>` with existing config; no JSON edit.
- Existing batch: `npm run sync` still syncs `repositories`.
- Shared labels remain the single source of truth in the config file.
