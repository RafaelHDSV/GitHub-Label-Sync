/**
 * @param {string[]} argv process.argv
 * @returns {{ configPath: string, repos: string[] }}
 */
export function parseCliArgs(argv) {
  const args = argv.slice(2)
  if (args.length === 0) {
    return { configPath: 'labels.config.json', repos: [] }
  }
  const [first, ...rest] = args
  if (first.toLowerCase().endsWith('.json')) {
    return { configPath: first, repos: rest }
  }
  return { configPath: 'labels.config.json', repos: args }
}

/**
 * @param {{ owner: string, cliRepos: string[], configRepositories: unknown }} input
 * @returns {string[]}
 */
export function resolveRepositories({ owner, cliRepos, configRepositories }) {
  const fromCli = []
  for (const raw of cliRepos) {
    if (typeof raw !== 'string') continue
    const trimmed = raw.trim()
    if (!trimmed) continue

    if (trimmed.includes('/')) {
      const slash = trimmed.indexOf('/')
      const maybeOwner = trimmed.slice(0, slash)
      const repo = trimmed.slice(slash + 1).trim()
      if (!repo || repo.includes('/')) {
        throw new Error(`Nome de repositório inválido: ${trimmed}`)
      }
      if (maybeOwner !== owner) {
        throw new Error(
          `Owner "${maybeOwner}" em "${trimmed}" não confere com owner do config ("${owner}").`
        )
      }
      fromCli.push(repo)
    } else {
      fromCli.push(trimmed)
    }
  }

  if (fromCli.length > 0) return fromCli

  if (!Array.isArray(configRepositories) || configRepositories.length === 0) {
    throw new Error(
      'Informe repos na CLI (npm run sync -- <repo>) ou preencha "repositories" no JSON.'
    )
  }

  const fromConfig = []
  for (const repo of configRepositories) {
    if (typeof repo !== 'string' || !repo.trim()) continue
    fromConfig.push(repo.trim())
  }
  if (fromConfig.length === 0) {
    throw new Error(
      'Informe repos na CLI (npm run sync -- <repo>) ou preencha "repositories" no JSON.'
    )
  }
  return fromConfig
}
