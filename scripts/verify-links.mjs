#!/usr/bin/env node

import fs from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'

const DATA_PATH = fileURLToPath(
  new URL('../src/data/releases.json', import.meta.url),
)

const data = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'))
const targets = data.releases.flatMap((release) =>
  release.assets.map((asset) => ({
    tag: release.tag,
    name: asset.name,
    url: asset.downloadUrl,
  })),
)

if (targets.length === 0) {
  console.error('No downloadable assets found in the snapshot.')
  process.exit(1)
}

let failures = 0
let checked = 0
const queue = [...targets]

async function worker() {
  while (queue.length > 0) {
    const target = queue.shift()
    if (!target) return
    try {
      const response = await fetch(target.url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': 'luminara-download-site-link-check' },
        signal: AbortSignal.timeout(25000),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      checked += 1
      console.log(`OK   ${target.tag} ${target.name}`)
    } catch (error) {
      failures += 1
      console.error(`FAIL ${target.tag} ${target.name}: ${error.message}`)
    }
  }
}

await Promise.all(Array.from({ length: 3 }, () => worker()))

console.log(`Checked ${targets.length} assets: ${checked} OK, ${failures} failed.`)
if (failures > 0) process.exit(1)
