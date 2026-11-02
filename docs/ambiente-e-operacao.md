# Ambiente e operação

> **Para que serve:** instalar, configurar e rodar o sync.
> **Fonte da verdade:** `package.json`, `labels.config.example.json`, `sync.mjs`.
> **Relacionados:** [context](context.md)

## Requisitos

- Node.js 18+
- PAT classic com escopo `repo` (escrita em labels)

## Setup

```bash
npm install
copy labels.config.example.json labels.config.json
```

Opcional: `.env` com `GITHUB_TOKEN=...`.

Em `labels.config.json`: `owner`, `repositories` (nomes sem `owner/`) e `labels` (`name`, `color`, `description` opcional).

## Rodar

```bash
node sync.mjs
# ou com repos na CLI, conforme o script
```
