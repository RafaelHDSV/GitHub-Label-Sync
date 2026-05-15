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

Se aparecer **Connect Timeout** ou **500** intermitente na API, ajuste opcional no `.env` (por padrão o script já usa **fetch nativo do Node** e **1** tentativa de retry do Octokit):

- `GITHUB_RETRY_RETRIES` — número de retentativas do plugin (padrão **`1`**).
- `GITHUB_USE_NODE_FETCH` — **omitido**, `1`, `true` ou `yes`: **fetch nativo** do Node (padrão). `0`, `false`, `no` ou `off`: modo **undici** com timeouts longos e **`EnvHttpProxyAgent`** (útil para `HTTPS_PROXY` / rede corporativa).
- `GITHUB_CONNECT_TIMEOUT_MS`, `GITHUB_HEADERS_TIMEOUT_MS`, `GITHUB_BODY_TIMEOUT_MS` — só aplicam com **`GITHUB_USE_NODE_FETCH=0`** (padrão `60000` / `120000` / `120000`).
- `GITHUB_DNS_RESULT_ORDER=verbatim` — só se precisar da ordem DNS padrão do Node; o padrão do script é priorizar **IPv4** (`ipv4first`).

Defina `DEBUG=1` para imprimir o erro completo (inclui stack).

### `curl` ok, Postman ou `npm run sync` não?

No Windows, o **`curl.exe`** frequentemente usa **Schannel** (TLS do sistema). Este projeto **não é frontend** (`sync.mjs` é CLI Node; **CORS** não se aplica).

Por padrão o Octokit usa o **fetch nativo do Node** (sem injetar o `fetch` do pacote `undici` com dispatcher). Se precisar do cliente undici (timeouts maiores, `HTTPS_PROXY` via `EnvHttpProxyAgent`), defina **`GITHUB_USE_NODE_FETCH=0`** no `.env`.

### `ETIMEDOUT` / conexão com `api.github.com`

Se o log mostrar **`connect ETIMEDOUT`** para um IP em `:443`, o Node **não está conseguindo abrir TCP** até a API do GitHub. Isso costuma ser **rede local**, não token:

- Firewall ou antivírus bloqueando o `node.exe`; VPN instável; roteador/ISP.
- Rede corporativa que **só sai pela internet via proxy HTTP(S)**.

Com **`GITHUB_USE_NODE_FETCH=0`**, configure no `.env` ou no shell as variáveis padrão de proxy (o script usa o **`EnvHttpProxyAgent`** do undici, que as respeita):

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
