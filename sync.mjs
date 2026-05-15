import 'dotenv/config'
import dns from 'node:dns'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

// Reduz falhas em redes onde IPv6 para api.github.com atrasa ou não roteia (comum no Windows).
const dnsOrder = process.env.GITHUB_DNS_RESULT_ORDER
if (dnsOrder === 'verbatim') {
  dns.setDefaultResultOrder('verbatim')
} else {
  dns.setDefaultResultOrder('ipv4first')
}
import { retry } from '@octokit/plugin-retry'
import { Octokit } from '@octokit/rest'
import { EnvHttpProxyAgent, fetch as undiciFetch } from 'undici'

const OctokitWithRetry = Octokit.plugin(retry)

function createOctokit(auth) {
  const connectTimeout = Number(process.env.GITHUB_CONNECT_TIMEOUT_MS) || 60_000
  const headersTimeout = Number(process.env.GITHUB_HEADERS_TIMEOUT_MS) || 120_000
  const bodyTimeout = Number(process.env.GITHUB_BODY_TIMEOUT_MS) || 120_000
  const dispatcher = new EnvHttpProxyAgent({
    connectTimeout,
    headersTimeout,
    bodyTimeout
  })
  const fetchWithTimeouts = (url, init = {}) =>
    undiciFetch(url, { ...init, dispatcher })

  const retries = Number(process.env.GITHUB_RETRY_RETRIES)
  const retryOpts =
    Number.isFinite(retries) && retries >= 0 ? { retries } : { retries: 4 }

  return new OctokitWithRetry({
    auth,
    request: { fetch: fetchWithTimeouts },
    retry: retryOpts
  })
}

function normalizeColor(color) {
  if (typeof color !== 'string' || !color.trim()) {
    throw new Error('Cada label precisa de "color" (hex com ou sem #).')
  }
  return color.replace(/^#/, '').toLowerCase()
}

async function listAllLabels(octokit, owner, repo) {
  const labels = []
  for (let page = 1; ; page += 1) {
    const { data } = await octokit.rest.issues.listLabelsForRepo({
      owner,
      repo,
      per_page: 100,
      page
    })
    labels.push(...data)
    if (data.length < 100) break
  }
  return labels
}

async function syncRepo(octokit, owner, repo, desired) {
  const existing = await listAllLabels(octokit, owner, repo)
  const desiredNames = new Set(
    desired.map((d) => d.name).filter((n) => typeof n === 'string' && n.length > 0)
  )

  const byName = new Map(existing.map((l) => [l.name, l]))

  for (const name of [...byName.keys()]) {
    if (!desiredNames.has(name)) {
      await octokit.rest.issues.deleteLabel({ owner, repo, name })
      byName.delete(name)
      console.log(`    removido: ${name}`)
    }
  }

  for (const raw of desired) {
    const name = raw.name
    if (!name || typeof name !== 'string') {
      throw new Error('Cada label precisa de "name" (string).')
    }
    const color = normalizeColor(raw.color)
    const description = raw.description ?? ''

    const current = byName.get(name)
    if (current) {
      const sameColor = (current.color || '').toLowerCase() === color
      const sameDesc = (current.description ?? '') === description
      if (sameColor && sameDesc) {
        console.log(`    inalterado: ${name}`)
      } else {
        await octokit.rest.issues.updateLabel({
          owner,
          repo,
          name,
          new_name: name,
          color,
          description
        })
        console.log(`    atualizado: ${name}`)
      }
    } else {
      await octokit.rest.issues.createLabel({
        owner,
        repo,
        name,
        color,
        description
      })
      byName.set(name, { name, color, description })
      console.log(`    criado: ${name}`)
    }
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    console.error('Defina a variável de ambiente GITHUB_TOKEN (classic: repo).')
    process.exit(1)
  }

  const configArg = process.argv[2] || 'labels.config.json'
  const configPath = resolve(process.cwd(), configArg)
  let text
  try {
    text = await readFile(configPath, 'utf8')
  } catch (e) {
    console.error(`Não foi possível ler o arquivo: ${configPath}`)
    console.error('Uso: GITHUB_TOKEN=... node sync.mjs [caminho/para/labels.config.json]')
    process.exit(1)
  }

  const config = JSON.parse(text)
  const owner = config.owner
  const repositories = config.repositories
  const labels = config.labels

  if (!owner || typeof owner !== 'string') {
    console.error('O JSON precisa de "owner" (seu usuário GitHub).')
    process.exit(1)
  }
  if (!Array.isArray(repositories) || repositories.length === 0) {
    console.error('O JSON precisa de "repositories" (array de nomes de repo, sem owner).')
    process.exit(1)
  }
  if (!Array.isArray(labels) || labels.length === 0) {
    console.error('O JSON precisa de "labels" (array de objetos com name, color, opcional description).')
    process.exit(1)
  }

  const octokit = createOctokit(token)

  for (const repo of repositories) {
    if (typeof repo !== 'string' || !repo.trim()) continue
    console.log(`${owner}/${repo}`)
    await syncRepo(octokit, owner, repo.trim(), labels)
  }

  console.log('Concluído.')
}

main().catch((err) => {
  const msg = err.message || String(err)
  console.error(msg)
  const cause = err.cause
  if (cause) {
    const causeMsg = cause.message || String(cause)
    console.error('Causa (rede/TLS):', causeMsg)
    const deep = cause.cause
    if (deep && (deep.message || deep.code)) {
      console.error('Detalhe:', deep.message || deep.code)
    }
  }
  if (/ETIMEDOUT|ECONNREFUSED/i.test(msg) || (cause && /ETIMEDOUT|ECONNREFUSED/i.test(cause.message || ''))) {
    console.error(
      'Dica: falha de rota até api.github.com (firewall/VPN/ISP ou proxy). Veja README: seção ETIMEDOUT; use HTTPS_PROXY se a rede for corporativa.'
    )
  }
  if (process.env.DEBUG) {
    console.error(err)
  }
  process.exit(1)
})
