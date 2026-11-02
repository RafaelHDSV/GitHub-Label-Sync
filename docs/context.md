# GitHub Label Sync — contexto

> **Para que serve:** hub `ai-context` desta ferramenta.
> **Fonte da verdade:** `sync.mjs`, `labels.config.example.json`.
> **Relacionados:** [especificacao](especificacao.md) · [ambiente-e-operacao](ambiente-e-operacao.md)

## Objetivo

Alinhar labels (nome, cor, descrição) entre vários repositórios GitHub do mesmo usuário: cria o que falta, atualiza o que diverge e remove o que não está na lista canônica.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 18+ |
| API | GitHub REST (labels) |
| Config | `labels.config.json` + opcional `.env` (`GITHUB_TOKEN`) |

## Decisões fixas

1. A lista em JSON é a fonte de verdade; o que não está nela é removido no sync.
2. `labels.config.json` e `.env` ficam fora do Git; use os `.example`.
3. Útil para repos no mesmo GitHub Project.

## Índice

| Documento | Conteúdo | Quando ler |
|---|---|---|
| [context.md](context.md) | Este hub | Sempre |
| [especificacao.md](especificacao.md) | O que a ferramenta faz | Antes de mudar comportamento |
| [ambiente-e-operacao.md](ambiente-e-operacao.md) | Install, token, CLI | Antes de rodar ou configurar |
| [README.md](../README.md) | Pitch | Onboarding |
| [CHANGELOG.md](../CHANGELOG.md) | Mudanças | Release |
