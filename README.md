# github-label-sync

Ferramenta em Node para **alinhar labels** entre vários repositórios do GitHub (mesmo usuário): aplica a lista definida num JSON, **atualiza** o que já existe com o mesmo nome, **cria** o que falta e **remove** tudo o que não estiver nessa lista.

Útil quando vários repos entram no mesmo Project e você quer **um conjunto único de labels** (nome, cor e descrição) em todos eles.

## Requisitos

- Node.js 18 ou superior
- Token do GitHub com permissão de escrita nas labels dos repositórios (PAT **classic** com escopo `repo` costuma bastar)

## Instalação

```bash
npm install
```

## Configuração

1. Copie o exemplo e edite com seus dados:

   ```bash
   copy labels.config.example.json labels.config.json
   ```

2. Em `labels.config.json`:

   - **`owner`**: seu usuário GitHub (sem `@`).
   - **`repositories`**: só o **nome** de cada repositório (sem `owner/`).
   - **`labels`**: objetos com `name`, `color` (hex com ou sem `#`) e opcionalmente `description`.

O arquivo `labels.config.json` está no `.gitignore` para reduzir o risco de versionar dados locais; use o `.example` como modelo no repositório.

Opcionalmente, crie um `.env` na raiz (também ignorado pelo Git) com uma linha `GITHUB_TOKEN=...`. O `sync.mjs` carrega esse arquivo automaticamente via `dotenv`.

## Uso

Defina `GITHUB_TOKEN` e execute na pasta do projeto:

```bash
set GITHUB_TOKEN=ghp_...
npm run sync
```

Ou com caminho explícito para o JSON:

```bash
node sync.mjs caminho\para\labels.config.json
```

No PowerShell:

```powershell
$env:GITHUB_TOKEN = "ghp_..."
npm run sync
```

## Comportamento importante

- **Remoção:** qualquer label presente no repositório cujo **nome** não apareça em `labels` do JSON é **apagada**. Issues e PRs **deixam de ter** essa label; o GitHub não “reaplica” automaticamente se você criar outra label com o mesmo nome depois.
- **Atualização:** se o nome existe mas cor ou descrição mudaram, a label é atualizada.
- **Criação:** nomes que ainda não existem são criados.

Recomenda-se usar num ramo de teste ou num repo de prova antes de rodar em produção, até estar confiante na lista do JSON.

## Licença

MIT — ver [LICENSE](LICENSE).
