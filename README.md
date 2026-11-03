<p align="center">
  <strong>GitHub Label Sync</strong>
</p>

<p align="center">
  <strong>Um conjunto de labels. Todos os repositórios alinhados.</strong><br />
  Cria, atualiza e remove labels para o Project Vieira falar a mesma língua.
</p>

---

## Por que existe

Vários repositórios no mesmo Project com labels diferentes viram ruído: cores divergem, nomes duplicam, filtros quebram. Esta ferramenta aplica uma lista canônica em JSON e deixa o restante igual em todos os repos do usuário.

## O que você ganha

| | |
|---|---|
| **Lista única** | Nome, cor e descrição definidos uma vez |
| **Update seguro** | Atualiza o que já existe com o mesmo nome |
| **Limpeza** | Remove labels que não estão na lista |
| **CLI flexível** | Repos no JSON ou passados na linha de comando |

## Como funciona

```text
labels.config.json + GITHUB_TOKEN
        ↓
   sync.mjs  →  GitHub Labels API
        ↓
 create / update / delete até bater com a lista
```

`labels.config.json` e `.env` ficam fora do Git — use os `.example`.

## Posicionamento

| Label Sync é | Label Sync não é |
|---|---|
| Alinhamento de labels | Gestor de Projects/milestones |
| Lista canônica destrutiva no excesso | Merge soft de labels extras |
| Ferramenta local Node | SaaS |

## Stack (em uma linha)

Node.js 18+ · GitHub REST labels · config JSON + token em `.env`.

Detalhes: [`docs/context.md`](docs/context.md) · especificação: [`docs/especificacao.md`](docs/especificacao.md).

## Começar

Install, token e CLI: [`docs/ambiente-e-operacao.md`](docs/ambiente-e-operacao.md).

Contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md) · conduta: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) · mudanças: [`CHANGELOG.md`](CHANGELOG.md).
