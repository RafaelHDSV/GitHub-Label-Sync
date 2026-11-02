# Especificação

> **Para que serve:** comportamento da ferramenta de sync de labels.
> **Fonte da verdade:** `sync.mjs`.
> **Relacionados:** [context](context.md)

## Objetivo

Manter o mesmo conjunto de labels em vários repositórios.

## O que existe hoje

- Sync por repositórios listados no JSON ou passados na CLI
- Update por nome, create se faltar, delete o que sobrar
- Carrega `GITHUB_TOKEN` de `.env` via dotenv

## O que não faz

- Não gerencia Projects, milestones ou issues
- Não sincroniza entre organizações diferentes sem ajustar `owner`
