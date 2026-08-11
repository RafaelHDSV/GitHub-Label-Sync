import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { parseCliArgs, resolveRepositories } from './cli.mjs'

describe('parseCliArgs', () => {
  it('defaults config and empty repos when no args', () => {
    assert.deepEqual(parseCliArgs(['node', 'sync.mjs']), {
      configPath: 'labels.config.json',
      repos: []
    })
  })

  it('treats first .json arg as config path', () => {
    assert.deepEqual(parseCliArgs(['node', 'sync.mjs', 'custom.json', 'repo-a']), {
      configPath: 'custom.json',
      repos: ['repo-a']
    })
  })

  it('treats non-json first arg as repo name', () => {
    assert.deepEqual(parseCliArgs(['node', 'sync.mjs', 'my-repo']), {
      configPath: 'labels.config.json',
      repos: ['my-repo']
    })
  })

  it('accepts multiple repos after config', () => {
    assert.deepEqual(
      parseCliArgs(['node', 'sync.mjs', 'labels.config.json', 'a', 'b']),
      { configPath: 'labels.config.json', repos: ['a', 'b'] }
    )
  })
})

describe('resolveRepositories', () => {
  it('uses CLI repos when provided', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: ['workday'],
        configRepositories: ['old']
      }),
      ['workday']
    )
  })

  it('falls back to config repositories when CLI empty', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: [],
        configRepositories: ['a', 'b']
      }),
      ['a', 'b']
    )
  })

  it('strips matching owner/ prefix', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: ['RafaelHDSV/workday'],
        configRepositories: []
      }),
      ['workday']
    )
  })

  it('rejects mismatched owner in owner/repo', () => {
    assert.throws(
      () =>
        resolveRepositories({
          owner: 'RafaelHDSV',
          cliRepos: ['other/workday'],
          configRepositories: []
        }),
      /owner/i
    )
  })

  it('errors when no CLI repos and config list empty', () => {
    assert.throws(
      () =>
        resolveRepositories({
          owner: 'RafaelHDSV',
          cliRepos: [],
          configRepositories: []
        }),
      /repositories|CLI|nome/i
    )
  })

  it('skips blank CLI entries', () => {
    assert.deepEqual(
      resolveRepositories({
        owner: 'RafaelHDSV',
        cliRepos: ['  ', 'workday'],
        configRepositories: []
      }),
      ['workday']
    )
  })
})
