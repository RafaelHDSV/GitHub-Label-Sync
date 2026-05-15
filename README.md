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

Se aparecer **Connect Timeout** ou **500** intermitente na API, a rede ou o GitHub podem estar lentos. O script já usa timeouts maiores (60s de conexão por padrão) e **retentativas** automáticas. Opcional no `.env`:

- `GITHUB_CONNECT_TIMEOUT_MS` (padrão `60000`)
- `GITHUB_HEADERS_TIMEOUT_MS` (padrão `120000`)
- `GITHUB_BODY_TIMEOUT_MS` (padrão `120000`)
- `GITHUB_RETRY_RETRIES` (padrão `4` tentativas com backoff)
- `GITHUB_DNS_RESULT_ORDER=verbatim` — só se precisar da ordem DNS padrão do Node; o padrão do script é priorizar **IPv4** (`ipv4first`), o que costuma evitar atraso com `api.github.com` em algumas redes Windows.
- `GITHUB_USE_NODE_FETCH=1` — usa o **fetch padrão do Node** em vez do `fetch` do pacote `undici` com dispatcher custom (útil se `curl` no mesmo PC funciona e o sync não). Ver subseção abaixo.

Defina `DEBUG=1` para imprimir o erro completo (inclui stack).

### `curl` ok, Postman ou `npm run sync` não?

No Windows, o **`curl.exe`** frequentemente usa **Schannel** (TLS do sistema). A mensagem `schannel: remote party requests renegotiation` no verbose do curl costuma ser **informativa**, não prova por si só que “só Postman quebra”.

Este projeto **não é frontend**: o `sync.mjs` roda no **Node**; **CORS** não se aplica. Se um `curl` ou um `fetch` mínimo no Node retorna `200` mas o sync falha, o caminho padrão do script (undici + timeouts + `EnvHttpProxyAgent`) pode estar divergindo desse stack — aí use **`GITHUB_USE_NODE_FETCH=1`** no `.env` e rode `npm run sync` de novo. Com isso, o Octokit usa o fetch nativo do processo (timeouts/proxy do undici deste script deixam de ser injetados nessa camada).

### `ETIMEDOUT` / conexão com `api.github.com`

Se o log mostrar **`connect ETIMEDOUT`** para um IP em `:443`, o Node **não está conseguindo abrir TCP** até a API do GitHub. Isso costuma ser **rede local**, não token:

- Firewall ou antivírus bloqueando o `node.exe`; VPN instável; roteador/ISP.
- Rede corporativa que **só sai pela internet via proxy HTTP(S)**.

Nesse caso, configure no `.env` ou no shell as variáveis padrão de proxy (o script usa o **`EnvHttpProxyAgent`** do undici, que as respeita):

- `HTTPS_PROXY` / `https_proxy` — ex.: `http://usuario:senha@proxy.empresa.com:8080`
- `HTTP_PROXY` / `http_proxy` — se a sua política exigir
- `NO_PROXY` — hosts que não devem passar pelo proxy (ex.: `localhost,127.0.0.1`)

Teste rápido fora do script: abra o mesmo Wi‑Fi no celular ou use outro link (hotspot) e rode `npm run sync` de novo.

## Comportamento importante

- **Remoção:** qualquer label presente no repositório cujo **nome** não apareça em `labels` do JSON é **apagada**. Issues e PRs **deixam de ter** essa label; o GitHub não “reaplica” automaticamente se você criar outra label com o mesmo nome depois.
- **Atualização:** se o nome existe mas cor ou descrição mudaram, a label é atualizada.
- **Criação:** nomes que ainda não existem são criados.

Recomenda-se usar num ramo de teste ou num repo de prova antes de rodar em produção, até estar confiante na lista do JSON.

## Licença

MIT — ver [LICENSE](LICENSE).
