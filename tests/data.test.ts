import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  heroRelease,
  latestStable,
  loadersForRelease,
  supportedAssets,
} from '@/lib/release-select'
import { validateReleasesFile } from '../scripts/lib/release-utils.mjs'
import type { ReleasesFile } from '@/types/releases'

const dataPath = fileURLToPath(
  new URL('../src/data/releases.json', import.meta.url),
)
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8')) as ReleasesFile

describe('committed release snapshot', () => {
  it('passes schema and invariant validation', () => {
    expect(validateReleasesFile(data)).toEqual([])
  })

  it('contains both release lines and their known edge cases', () => {
    const trials = data.releases.filter(
      (release) => release.branch === 'trials',
    )
    const feudalkings = data.releases.filter(
      (release) => release.branch === 'feudalkings',
    )

    expect(data.releases.length).toBeGreaterThanOrEqual(17)
    expect(trials.length).toBeGreaterThanOrEqual(15)
    expect(feudalkings.length).toBeGreaterThanOrEqual(2)

    expect(trials.some((release) => release.tag === 'Trials/1.0.16')).toBe(true)
    expect(
      feudalkings.some(
        (release) => release.tag === 'FeudalKings/1.0.15-beta.1',
      ),
    ).toBe(true)
  })

  it('resolves a supported hero for both branches', () => {
    const trials = heroRelease(data.releases, 'trials')
    expect(trials).not.toBeNull()
    expect(supportedAssets(trials!).length).toBeGreaterThan(0)

    const feudalkings = heroRelease(data.releases, 'feudalkings')
    expect(feudalkings).not.toBeNull()
    expect(supportedAssets(feudalkings!).length).toBeGreaterThan(0)

    const stable = latestStable(data.releases, 'feudalkings')
    if (stable === null) {
      expect(feudalkings?.prerelease).toBe(true)
    }
  })

  it('handles the ZIP-only legacy release', () => {
    const release = data.releases.find(
      (entry) => entry.tag === 'Trials/1.0.8',
    )
    expect(release).toBeDefined()
    expect(release?.assets).toEqual([])
    expect(release?.otherAssets).toEqual(['Luminara.zip'])
  })

  it('includes the unprefixed fix release', () => {
    const release = data.releases.find(
      (entry) => entry.tag === '1.0.9.1-Fix',
    )
    expect(release).toBeDefined()
    expect(release?.legacy).toBe(true)
    expect(release?.tagPrefix).toBeNull()
  })

  it('marks the Fabric JAR on Trials as unsupported', () => {
    const release = data.releases.find(
      (entry) => entry.tag === 'Trials/1.0.15-alpha.1',
    )
    expect(release).toBeDefined()
    expect(release?.assets).toHaveLength(1)
    expect(release?.assets[0].loader).toBe('fabric')
    expect(release?.assets[0].compatibility).toBe('unsupported')
    expect(supportedAssets(release!)).toHaveLength(0)
  })

  it('exposes both loaders on the FeudalKings beta', () => {
    const release = data.releases.find(
      (entry) => entry.tag === 'FeudalKings/1.0.15-beta.1',
    )
    expect(loadersForRelease(release ?? null)).toEqual([
      'neoforge',
      'fabric',
    ])
  })

  it('only uses GitHub release asset URLs', () => {
    for (const release of data.releases) {
      for (const asset of release.assets) {
        expect(
          asset.downloadUrl.startsWith(
            'https://github.com/CraftAmethyst/Luminara/releases/download/',
          ),
        ).toBe(true)
      }
    }
  })

  it('stores valid checksums and tolerates missing ones', () => {
    let withChecksum = 0
    for (const release of data.releases) {
      for (const asset of release.assets) {
        if (asset.checksum === null) continue
        expect(asset.checksum.sha256).toMatch(/^[0-9a-f]{64}$/)
        withChecksum += 1
      }
    }
    expect(withChecksum).toBeGreaterThan(0)
  })
})
