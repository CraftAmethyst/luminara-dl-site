import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  isExperimentalRelease,
  releaseStatus,
  statusBadgeClass,
} from '@/lib/release-status'
import type { Release, ReleasesFile } from '@/types/releases'

const data = JSON.parse(
  fs.readFileSync(
    fileURLToPath(new URL('../src/data/releases.json', import.meta.url)),
    'utf8',
  ),
) as ReleasesFile

function byTag(tag: string): Release {
  const release = data.releases.find((entry) => entry.tag === tag)
  if (!release) throw new Error(`Missing release ${tag}`)
  return release
}

describe('release status labels', () => {
  it('classifies stable, prerelease, and alpha releases', () => {
    expect(releaseStatus(byTag('Trials/1.0.16'))).toBe('stable')
    expect(releaseStatus(byTag('Trials/1.0.16-beta.1'))).toBe('prerelease')
    expect(releaseStatus(byTag('FeudalKings/1.0.15-beta.1'))).toBe(
      'prerelease',
    )
    expect(releaseStatus(byTag('Trials/1.0.15-alpha.1'))).toBe(
      'experimental',
    )
    expect(releaseStatus(byTag('FK/a1.0.15'))).toBe('experimental')
  })

  it('detects alpha from tag, name, or asset names', () => {
    const alpha = byTag('Trials/1.0.15-alpha.1')
    expect(isExperimentalRelease(alpha)).toBe(true)

    const legacyAlpha = byTag('FK/a1.0.15')
    expect(legacyAlpha.version).toBe('1.0.15')
    expect(isExperimentalRelease(legacyAlpha)).toBe(true)
  })

  it('keeps alpha purple even if the API marks it stable', () => {
    const alpha = { ...byTag('Trials/1.0.15-alpha.1'), prerelease: false }
    expect(releaseStatus(alpha)).toBe('experimental')
  })

  it('maps statuses to the expected badge classes', () => {
    expect(statusBadgeClass('stable')).toBe('badge-success')
    expect(statusBadgeClass('experimental')).toBe('badge-experimental')
    expect(statusBadgeClass('prerelease')).toBe('badge-warn')
  })
})
