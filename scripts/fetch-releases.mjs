#!/usr/bin/env node

import fs from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { fetchReleases, fetchText } from './lib/github.mjs'
import { resolveChecksum } from './lib/checksums.mjs'
import {
  REPO,
  normalizeRelease,
  sortReleasesDesc,
  validateReleasesFile,
} from './lib/release-utils.mjs'

const DATA_PATH = fileURLToPath(
  new URL('../src/data/releases.json', import.meta.url),
)
const args = new Set(process.argv.slice(2))
const checkOnly = args.has('--check')
const allowRegression = args.has('--allow-regression')

function log(message) {
  console.log(message)
}

function warn(message) {
  console.warn(`warning: ${message}`)
}

async function readExisting() {
  try {
    const text = await fs.readFile(DATA_PATH, 'utf8')
    return JSON.parse(text)
  } catch (error) {
    if (error.code === 'ENOENT') return null
    warn(`Existing snapshot is unreadable: ${error.message}`)
    return null
  }
}

function payloadWithoutTimestamp(data) {
  return JSON.stringify({
    schemaVersion: data.schemaVersion,
    repo: data.repo,
    releases: data.releases,
  })
}

async function writeAtomic(file, content) {
  const temp = `${file}.${process.pid}.tmp`
  await fs.writeFile(temp, content, 'utf8')
  try {
    await fs.rename(temp, file)
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EEXIST') {
      await new Promise((resolve) => setTimeout(resolve, 150))
      try {
        await fs.rename(temp, file)
        return
      } catch (retryError) {
        await fs.rm(temp, { force: true })
        throw retryError
      }
    }
    await fs.rm(temp, { force: true })
    throw error
  }
}

function summarize(releases) {
  const counts = { trials: 0, feudalkings: 0 }
  for (const release of releases) counts[release.branch] += 1
  const latestStable = releases.find(
    (release) =>
      !release.prerelease &&
      !release.legacy &&
      release.assets.some((asset) => asset.compatibility === 'supported'),
  )
  return (
    `${releases.length} releases (${counts.trials} trials, ` +
    `${counts.feudalkings} feudalkings); latest stable: ` +
    `${latestStable ? latestStable.tag : 'none'}`
  )
}

async function main() {
  const token = process.env.GITHUB_TOKEN?.trim() ?? ''

  log(
    `Fetching releases for ${REPO} ` +
      `${token ? 'with GITHUB_TOKEN' : 'without a token'}...`,
  )
  const apiReleases = await fetchReleases(token)

  const normalized = []
  for (const apiRelease of apiReleases) {
    const release = normalizeRelease(apiRelease)
    if (release) normalized.push({ apiRelease, release })
  }

  const checksumCache = new Map()
  async function cachedFetchText(url) {
    if (!checksumCache.has(url)) {
      checksumCache.set(url, await fetchText(url))
    }
    return checksumCache.get(url)
  }

  for (const { apiRelease, release } of normalized) {
    for (const asset of release.assets) {
      if (asset.checksum) continue
      asset.checksum = await resolveChecksum(
        apiRelease.assets ?? [],
        asset,
        cachedFetchText,
        { warn: (message) => warn(`${release.tag}: ${message}`) },
      )
    }
  }

  const releases = sortReleasesDesc(
    normalized.map((entry) => entry.release),
  )
  const data = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repo: REPO,
    releases,
  }

  const errors = validateReleasesFile(data)
  if (errors.length > 0) {
    console.error('Refusing to write an invalid snapshot:')
    for (const error of errors) console.error(`  - ${error}`)
    process.exit(1)
  }

  const previous = await readExisting()
  const hasPrevious = Array.isArray(previous?.releases) && previous.releases.length > 0

  if (hasPrevious) {
    const regression = releases.length < previous.releases.length * 0.7
    const branches = ['trials', 'feudalkings']
    const lostBranch = branches.find((branch) => {
      const had = previous.releases.some(
        (release) =>
          release.branch === branch &&
          release.assets.some((asset) => asset.compatibility === 'supported'),
      )
      const has = releases.some(
        (release) =>
          release.branch === branch &&
          release.assets.some((asset) => asset.compatibility === 'supported'),
      )
      return had && !has
    })
    const noSupported = !releases.some((release) =>
      release.assets.some((asset) => asset.compatibility === 'supported'),
    )

    if ((regression || lostBranch || noSupported) && !allowRegression) {
      console.error('Regression guard triggered:')
      if (regression) {
        console.error(
          `  - release count dropped from ${previous.releases.length} ` +
            `to ${releases.length}`,
        )
      }
      if (lostBranch) {
        console.error(`  - branch ${lostBranch} lost all supported assets`)
      }
      if (noSupported) console.error('  - no supported assets remain')
      console.error('Re-run with --allow-regression if this is intentional.')
      process.exit(1)
    }
  }

  if (
    hasPrevious &&
    payloadWithoutTimestamp(previous) === payloadWithoutTimestamp(data)
  ) {
    log(`No release changes. ${summarize(releases)}`)
    return
  }

  if (checkOnly) {
    console.error(`Snapshot would change. ${summarize(releases)}`)
    process.exit(1)
  }

  await writeAtomic(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`)
  log(`Snapshot updated: ${DATA_PATH}`)
  log(summarize(releases))
}

main().catch((error) => {
  console.error(error.stack ?? error.message)
  process.exit(1)
})
