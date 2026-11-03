# CLI repo argument Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow `npm run sync -- <repo>` to sync labels to a named repo without editing `labels.config.json`, while keeping batch mode when no CLI repos are passed.

**Architecture:** Extract pure CLI parsing and target-resolution helpers into `cli.mjs`, unit-test them with Node’s built-in test runner, then wire `sync.mjs` to use those helpers. Octokit label sync logic stays untouched.

**Tech Stack:** Node.js ≥18 (ESM), `node:test` / `node:assert/strict`, existing `@octokit/rest` sync path, npm scripts.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-11-cli-repo-arg-design.md`
- Do not add `--all`, global bin, `git remote` detection, or writing CLI names back into JSON
- Do not change create/update/delete label behavior in `syncRepo`
- Keep Portuguese user-facing error/usage strings consistent with existing `sync.mjs` tone
- Workspace git lock: do **not** `git commit` / `git push` unless the user explicitly asks; skip commit steps otherwise
- Root `.gitignore` currently ignores `docs` and `docs/*` — Task 3 un-ignores `docs/superpowers/` so specs/plans can be versioned when the user commits

---

## File structure

| File | Responsibility |
|------|----------------|
| `cli.mjs` | `parseCliArgs(argv)` and `resolveRepositories({ owner, cliRepos, configRepositories })` — pure, no I/O |
| `cli.test.mjs` | Unit tests for the helpers above |
| `sync.mjs` | Load env/config, call helpers, run existing `syncRepo` loop |
| `package.json` | Add `test` script |
| `README.md` | Document CLI repo usage + batch fallback |
| `.gitignore` | Allow tracking `docs/superpowers/` |

No changes required to `labels.config.example.json` structure (already has `repositories` for batch).

---

### Task 1: CLI helpers + unit tests

**Files:**
- Create: `cli.mjs`
- Create: `cli.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: none (pure functions)
- Produces:
  - `parseCliArgs(argv: string[]): { configPath: string, repos: string[] }`
  - `resolveRepositories(input: { owner: string, cliRepos: string[], configRepositories: unknown }): string[]` — throws `Error` with Portuguese message on failure

- [ ] **Step 1: Write the failing tests**

Create `cli.test.mjs`:

```js
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseCliArgs, resolveRepositories } from './cli.mjs'

describe('parseCliArgs', () => {
  it('defaults config and empty repos when no args', () => {
    assert.deepEqual(parseCliArgs(['node', 'sync.mjs']), {
      configPath: 'labels.config.json',
      repos: []
    })
  })

  it('treats first .json arg as config path', () => {
    assert.deepEqual(parseCliArgs(['node', 'sync.mjs', 'custom.json', 'repo-a']), {
      configPath: 'custom.json',
      repos: ['repo-a']
    })
  })

  it('treats non-json first arg as repo name', () => {
    assert.deepEqual(parseCliArgs(['node', 'sync.mjs', 'my-repo']), {
      configPath: 'labels.config.json',
      repos: ['my-repo']
    })
  })

  it('accepts multiple repos after config', () => {
    assert.deepEqual(
      parseCliArgs(['node', 'sync.mjs', 'labels.config.json', 'a', 'b']),
      { configPath: 'labels.config.json', repos: ['a', 'b'] }
    )
  })
})

describe('resolveRepositories', () => {
  it('uses CLI repos when provided', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: ['workday'],
        configRepositories: ['old']
      }),
      ['workday']
    )
  })

  it('falls back to config repositories when CLI empty', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: [],
        configRepositories: ['a', 'b']
      }),
      ['a', 'b']
    )
  })

  it('strips matching owner/ prefix', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: ['RafaelHDSV/workday'],
        configRepositories: []
      }),
      ['workday']
    )
  })

  it('rejects mismatched owner in owner/repo', () => {
    assert.throws(
      () =>
        resolveRepositories({
          owner: 'RafaelHDSV',
          cliRepos: ['other/workday'],
          configRepositories: []
        }),
      /owner/i
    )
  })

  it('errors when no CLI repos and config list empty', () => {
    assert.throws(
      () =>
        resolveRepositories({
          owner: 'RafaelHDSV',
          cliRepos: [],
          configRepositories: []
        }),
      /repositories|CLI|nome/i
    )
  })

  it('skips blank CLI entries', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: ['  ', 'workday'],
        configRepositories: []
      }),
      ['workday']
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test cli.test.mjs`

Expected: FAIL (cannot find module `./cli.mjs` or exports missing).

- [ ] **Step 3: Implement `cli.mjs`**

Create `cli.mjs`:

```js
/**
 * @param {string[]} argv process.argv
 * @returns {{ configPath: string, repos: string[] }}
 */
export function parseCliArgs(argv) {
  const args = argv.slice(2)
  if (args.length === 0) {
    return { configPath: 'labels.config.json', repos: [] }
  }
  const [first, ...rest] = args
  if (first.toLowerCase().endsWith('.json')) {
    return { configPath: first, repos: rest }
  }
  return { configPath: 'labels.config.json', repos: args }
}

/**
 * @param {{ owner: string, cliRepos: string[], configRepositories: unknown }} input
 * @returns {string[]}
 */
export function resolveRepositories({ owner, cliRepos, configRepositories }) {
  const fromCli = []
  for (const raw of cliRepos) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!trimmed) continue

    if (trimmed.includes('/')) {
      const slash = trimmed.indexOf('/')
      const maybeOwner = trimmed.slice(0, slash)
      const repo = trimmed.slice(slash + 1).trim()
      if (!repo || repo.includes('/')) {
        throw new Error(`Nome de repositório inválido: ${trimmed}`)
      }
      if (maybeOwner !== owner) {
        throw new Error(
          `Owner "${maybeOwner}" em "${trimmed}" não confere com owner do config ("${owner}").`
        )
      }
      fromCli.push(repo)
    } else {
      fromCli.push(trimmed)
    }
  }

  if (fromCli.length > 0) return fromCli

  if (!Array.isArray(configRepositories) || configRepositories.length === 0) {
    throw new Error(
      'Informe repos na CLI (npm run sync -- <repo>) ou preencha "repositories" no JSON.'
    )
  }

  const fromConfig = []
  for (const repo of configRepositories) {
    if (typeof repo !== 'string' || !repo.trim()) continue
    fromConfig.push(repo.trim())
  }
  if (fromConfig.length === 0) {
    throw new Error(
      'Informe repos na CLI (npm run sync -- <repo>) ou preencha "repositories" no JSON.'
    )
  }
  return fromConfig
}
```

- [ ] **Step 4: Add test script and run tests**

In `package.json`, add under `scripts`:

```json
"test": "node --test cli.test.mjs"
```

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit (only if user explicitly asked)**

```bash
git add cli.mjs cli.test.mjs package.json
git commit -m "$(cat <<'EOF'
feat: add CLI helpers to resolve sync target repos

EOF
)"
```

---

### Task 2: Wire `sync.mjs` + README + gitignore

**Files:**
- Modify: `sync.mjs`
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `parseCliArgs`, `resolveRepositories` from `./cli.mjs`
- Produces: working CLI as specified in the design doc

- [ ] **Step 1: Update `sync.mjs` imports and `main` argv/target handling**

Add import near the top (after other imports):

```js
import { parseCliArgs, resolveRepositories } from './cli.mjs'
```

Replace the config-path / repositories validation block in `main` (from `const configArg = ...` through the empty-`repositories` check) with:

```js
  const { configPath: configArg, repos: cliRepos } = parseCliArgs(process.argv)
  const configPath = resolve(process.cwd(), configArg)
  let text
  try {
    text = await readFile(configPath, 'utf8')
  } catch (e) {
    console.error(`Não foi possível ler o arquivo: ${configPath}`)
    console.error(
      'Uso: npm run sync -- <repo>   ou   node sync.mjs [labels.config.json] [repo…]'
    )
    process.exit(1)
  }

  const config = JSON.parse(text)
  const owner = config.owner
  const labels = config.labels

  if (!owner || typeof owner !== 'string') {
    console.error('O JSON precisa de "owner" (seu usuário GitHub).')
    process.exit(1)
  }
  if (!Array.isArray(labels) || labels.length === 0) {
    console.error('O JSON precisa de "labels" (array de objetos com name, color, opcional description).')
    process.exit(1)
  }

  let repositories
  try {
    repositories = resolveRepositories({
      owner,
      cliRepos,
      configRepositories: config.repositories
    })
  } catch (e) {
    console.error(e.message || String(e))
    process.exit(1)
  }
```

Leave the Octokit loop unchanged (`for (const repo of repositories) { ... }`).

- [ ] **Step 2: Update README usage section**

In `README.md`, under `## Uso`, keep the token/`npm run sync` batch example, then add immediately after it:

```markdown
Para um repositório específico (sem editar `repositories` no JSON):

```bash
npm run sync -- nome-do-repo
```

Vários de uma vez:

```bash
npm run sync -- repo-a repo-b
```

Também aceita `owner/repo` se o `owner` for o mesmo do JSON. Sem argumentos na CLI, o sync usa a lista `repositories` do arquivo de config (comportamento anterior).
```

Also update the “Ou com caminho explícito” example to:

```bash
node sync.mjs caminho\para\labels.config.json nome-do-repo
```

In `## Configuração`, after the bullet for **`repositories`**, add one sentence:

> Obrigatório só quando você roda o sync **sem** nomes de repo na CLI.

- [ ] **Step 3: Allow versioning superpowers docs**

Replace the `docs` / `docs/*` lines in `.gitignore` with:

```gitignore
docs/*
!docs/superpowers/
!docs/superpowers/**
```

Keep `node_modules/`, `labels.config.json`, and `.env` as they are.

- [ ] **Step 4: Verify unit tests still pass**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Smoke-check CLI parsing (no network)**

Run: `node -e "import { parseCliArgs, resolveRepositories } from './cli.mjs'; console.log(parseCliArgs(['node','sync.mjs','demo-repo'])); console.log(resolveRepositories({ owner: 'RafaelHDSV', cliRepos: ['demo-repo'], configRepositories: [] }))"`

Expected stdout roughly:

```
{ configPath: 'labels.config.json', repos: [ 'demo-repo' ] }
[ 'demo-repo' ]
```

Optional live sync (only if user wants; needs real repo + token): `npm run sync -- <existing-repo>`.

- [ ] **Step 6: Commit (only if user explicitly asked)**

```bash
git add sync.mjs README.md .gitignore cli.mjs cli.test.mjs package.json docs/superpowers
git commit -m "$(cat <<'EOF'
feat: sync labels for a repo passed on the CLI

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `npm run sync -- <repo>` | Task 1 + 2 |
| Batch fallback via `repositories` | Task 1 + 2 |
| `node sync.mjs [config.json] [repo…]` | Task 1 (`parseCliArgs`) + 2 |
| Accept `owner/repo` with matching owner | Task 1 |
| Mismatched owner error | Task 1 |
| Empty CLI + empty `repositories` error | Task 1 |
| Labels/`syncRepo` unchanged | Task 2 (loop untouched) |
| README docs | Task 2 |
| No `--all` / bin / git remote / JSON write-back | Out of scope — not implemented |

## Self-review notes

- No TBD/placeholder steps; helpers fully specified.
- `parseCliArgs` / `resolveRepositories` names consistent across tasks.
- Commit steps gated by workspace git lock.
