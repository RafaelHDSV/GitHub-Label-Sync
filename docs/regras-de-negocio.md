# Regras de negócio

> **Para que serve:** algoritmos e regras do domínio que a IA não deve reinventar
> **Fonte da verdade:** módulos de domínio no código
> **Relacionados:** [especificacao](especificacao.md) · [api](api.md) · [banco-de-dados](banco-de-dados.md)

## Regras

1. A lista em JSON é a fonte de verdade; o que não está nela é removido no sync.
2. `labels.config.json` e `.env` ficam fora do Git; use os `.example`.
3. Útil para repos no mesmo GitHub Project.
