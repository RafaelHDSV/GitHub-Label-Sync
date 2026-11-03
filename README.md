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

## Para quem é

Quem mantém vários repos GitHub no mesmo quadro e quer labels idênticas sem editar repo a repo.

## Stack (em uma linha)

Node.js 18+ · GitHub REST labels · config JSON + token em `.env`.

Detalhes: [`docs/context.md`](docs/context.md).

## Começar

Install, token e CLI: [`docs/ambiente-e-operacao.md`](docs/ambiente-e-operacao.md).

Contribuição: [`CONTRIBUTING.md`](CONTRIBUTING.md) · conduta: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) · mudanças: [`CHANGELOG.md`](CHANGELOG.md).
