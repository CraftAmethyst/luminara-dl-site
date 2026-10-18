#!/usr/bin/env node

import fs from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { validateReleasesFile } from './lib/release-utils.mjs'

const DATA_PATH = fileURLToPath(
  new URL('../src/data/releases.json', import.meta.url),
)

let data
try {
  data = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'))
} catch (error) {
  console.error(`Could not read ${DATA_PATH}: ${error.message}`)
  console.error('Run `npm run data:refresh` to create the release snapshot.')
  process.exit(1)
}

const errors = validateReleasesFile(data)
if (errors.length > 0) {
  console.error('Release snapshot validation failed:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

const counts = { trials: 0, feudalkings: 0 }
for (const release of data.releases) counts[release.branch] += 1

const latestStable = data.releases.find(
  (release) =>
    !release.prerelease &&
    !release.legacy &&
    release.assets.some((asset) => asset.compatibility === 'supported'),
)

console.log(
  `OK: ${data.releases.length} releases ` +
    `(${counts.trials} trials, ${counts.feudalkings} feudalkings); ` +
    `latest stable: ${latestStable ? latestStable.tag : 'none'}; ` +
    `generated ${data.generatedAt}`,
)
