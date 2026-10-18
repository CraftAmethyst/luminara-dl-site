import { describe, expect, it } from 'vitest'
import {
  compareReleasesDesc,
  normalizeAsset,
  normalizeRelease,
  numericVersionParts,
  parseAssetFilename,
  resolveBranch,
  sortAssets,
  validateReleasesFile,
  versionFromTag,
} from '../scripts/lib/release-utils.mjs'

const REPO_URL = 'https://github.com/CraftAmethyst/Luminara'
const DOWNLOAD_PREFIX = `${REPO_URL}/releases/download`
const RELEASE_PREFIX = `${REPO_URL}/releases/tag`

function makeRelease(overrides = {}) {
  return {
    id: 1,
    tag: 'Trials/1.0.16',
    tagPrefix: 'Trials',
    branch: 'trials',
    version: '1.0.16',
    name: '1.0.16',
    htmlUrl: `${RELEASE_PREFIX}/Trials/1.0.16`,
    publishedAt: '2026-10-18T08:54:19Z',
    prerelease: false,
    legacy: false,
    assets: [
      {
        id: 1,
        name: 'luminara-forge-1.20.1-1.0.16.jar',
        size: 21823598,
        downloadUrl: `${DOWNLOAD_PREFIX}/Trials/1.0.16/luminara-forge-1.20.1-1.0.16.jar`,
        loader: 'forge',
        loaderSource: 'filename',
        minecraft: '1.20.1',
        minecraftSource: 'filename',
        compatibility: 'supported',
        checksum: {
          sha256: 'a'.repeat(64),
          source: 'github-digest',
          file: null,
        },
      },
    ],
    otherAssets: [],
    ...overrides,
  }
}

function makeApiRelease(overrides = {}) {
  return {
    id: 1,
    tag_name: 'Trials/1.0.16',
    target_commitish: 'stable/Trials',
    draft: false,
    prerelease: false,
    name: '1.0.16',
    html_url: `${RELEASE_PREFIX}/Trials/1.0.16`,
    published_at: '2026-10-18T08:54:19Z',
    assets: [],
    ...overrides,
  }
}

function apiAsset(name, overrides = {}) {
  return {
    id: name.length,
    name,
    size: 1000,
    browser_download_url: `${DOWNLOAD_PREFIX}/Trials/1.0.16/${name}`,
    digest: null,
    ...overrides,
  }
}

describe('resolveBranch', () => {
  it('maps prefixed branches', () => {
    expect(resolveBranch('Trials/1.0.16', 'stable/Trials')).toEqual({
      branch: 'trials',
      tagPrefix: 'Trials',
      legacy: false,
    })
    expect(
      resolveBranch('FeudalKings/1.0.15-beta.1', 'stable/FeudalKings'),
    ).toEqual({
      branch: 'feudalkings',
      tagPrefix: 'FeudalKings',
      legacy: false,
    })
    expect(resolveBranch('FK/a1.0.15', 'stable/FeudalKings')).toEqual({
      branch: 'feudalkings',
      tagPrefix: 'FK',
      legacy: true,
    })
  })

  it('accepts the unprefixed legacy fix on a supported branch', () => {
    expect(resolveBranch('1.0.9.1-Fix', 'stable/Trials')).toEqual({
      branch: 'trials',
      tagPrefix: null,
      legacy: true,
    })
  })

  it('rejects unrelated or non-version tags', () => {
    expect(resolveBranch('Whisper/1.0.0', 'stable/Trials')).toBeNull()
    expect(resolveBranch('upstream', 'stable/Trials')).toBeNull()
    expect(resolveBranch('1.0.0', 'main')).toBeNull()
  })
})

describe('version handling', () => {
  it('normalizes the FK alpha prefix for display', () => {
    expect(versionFromTag('FK/a1.0.15')).toBe('1.0.15')
    expect(versionFromTag('Trials/1.0.16')).toBe('1.0.16')
    expect(versionFromTag('1.0.9.1-Fix')).toBe('1.0.9.1-Fix')
    expect(versionFromTag('Trials/1.0.15-hotfix')).toBe('1.0.15-hotfix')
  })

  it('extracts numeric parts', () => {
    expect(numericVersionParts('1.0.16')).toEqual([1, 0, 16])
    expect(numericVersionParts('1.0.16-beta.1')).toEqual([1, 0, 16])
    expect(numericVersionParts('1.0.9.1-Fix')).toEqual([1, 0, 9, 1])
    expect(numericVersionParts('a1.0.15')).toEqual([1, 0, 15])
    expect(numericVersionParts('1.0.8.1')).toEqual([1, 0, 8, 1])
  })

  it('sorts by numeric version then publication date', () => {
    const newerPatch = makeRelease({
      id: 2,
      version: '1.0.8.1',
      publishedAt: '2025-10-07T14:07:28Z',
    })
    const olderPatch = makeRelease({
      id: 3,
      version: '1.0.8',
      publishedAt: '2025-07-29T06:53:33Z',
    })
    expect(compareReleasesDesc(newerPatch, olderPatch)).toBeLessThan(0)

    const stable = makeRelease({
      id: 4,
      version: '1.0.16',
      publishedAt: '2026-10-18T08:54:19Z',
    })
    const beta = makeRelease({
      id: 5,
      version: '1.0.16-beta.1',
      publishedAt: '2026-10-02T20:01:19Z',
    })
    expect(compareReleasesDesc(stable, beta)).toBeLessThan(0)

    const hotfix = makeRelease({
      id: 6,
      version: '1.0.15-hotfix',
      publishedAt: '2026-08-05T11:31:37Z',
    })
    const base = makeRelease({
      id: 7,
      version: '1.0.15',
      publishedAt: '2026-08-04T13:48:26Z',
    })
    expect(compareReleasesDesc(hotfix, base)).toBeLessThan(0)
  })
})

describe('asset parsing', () => {
  it('parses current and legacy filenames', () => {
    expect(parseAssetFilename('luminara-forge-1.20.1-1.0.16.jar')).toEqual({
      loader: 'forge',
      minecraft: '1.20.1',
      fileVersion: '1.0.16',
    })
    expect(parseAssetFilename('luminara-1.20.1-1.0.15.jar')).toEqual({
      loader: null,
      minecraft: '1.20.1',
      fileVersion: '1.0.15',
    })
    expect(
      parseAssetFilename('luminara-fabric-1.21.1-1.0.15-beta.1.jar'),
    ).toEqual({
      loader: 'fabric',
      minecraft: '1.21.1',
      fileVersion: '1.0.15-beta.1',
    })
    expect(parseAssetFilename('Luminara.zip')).toBeNull()
  })

  it('defaults legacy Trials filenames to Forge', () => {
    const asset = normalizeAsset(
      apiAsset('luminara-1.20.1-1.0.15.jar'),
      'trials',
    )
    expect(asset.loader).toBe('forge')
    expect(asset.loaderSource).toBe('branch-default')
    expect(asset.compatibility).toBe('supported')
  })

  it('marks the Fabric JAR on Trials as unsupported', () => {
    const asset = normalizeAsset(
      apiAsset('luminara-fabric-1.20.1-1.0.15-alpha.1.jar'),
      'trials',
    )
    expect(asset.loader).toBe('fabric')
    expect(asset.compatibility).toBe('unsupported')
  })

  it('reads the API digest and ignores checksum assets as downloads', () => {
    const release = normalizeRelease(
      makeApiRelease({
        assets: [
          apiAsset('luminara-forge-1.20.1-1.0.16.jar', {
            digest: `sha256:${'b'.repeat(64)}`,
          }),
          apiAsset('luminara-forge-1.20.1-1.0.16.jar.sha256'),
        ],
      }),
    )
    expect(release).not.toBeNull()
    expect(release.assets).toHaveLength(1)
    expect(release.assets[0].checksum).toEqual({
      sha256: 'b'.repeat(64),
      source: 'github-digest',
      file: null,
    })
    expect(release.otherAssets).toEqual([])
  })

  it('keeps ZIP-only releases with no JAR assets', () => {
    const release = normalizeRelease(
      makeApiRelease({
        tag_name: 'Trials/1.0.8',
        target_commitish: 'Trials',
        assets: [apiAsset('Luminara.zip')],
      }),
    )
    expect(release).not.toBeNull()
    expect(release.assets).toEqual([])
    expect(release.otherAssets).toEqual(['Luminara.zip'])
  })

  it('includes the unprefixed fix release via target_commitish', () => {
    const release = normalizeRelease(
      makeApiRelease({
        tag_name: '1.0.9.1-Fix',
        target_commitish: 'stable/Trials',
        assets: [apiAsset('luminara-1.20.1-1.0.9.1-fix.jar')],
      }),
    )
    expect(release).not.toBeNull()
    expect(release.legacy).toBe(true)
    expect(release.tagPrefix).toBeNull()
    expect(release.assets[0].loader).toBe('forge')
  })

  it('drops unrelated and draft releases', () => {
    expect(
      normalizeRelease(makeApiRelease({ tag_name: 'Whisper/1.0.0' })),
    ).toBeNull()
    expect(
      normalizeRelease(makeApiRelease({ tag_name: 'Trials/1.0.16', draft: true })),
    ).toBeNull()
  })

  it('sorts supported assets before unsupported ones', () => {
    const sorted = sortAssets([
      {
        name: 'b.jar',
        loader: 'fabric',
        compatibility: 'unsupported',
      },
      {
        name: 'a.jar',
        loader: 'neoforge',
        compatibility: 'supported',
      },
      {
        name: 'c.jar',
        loader: 'forge',
        compatibility: 'supported',
      },
    ])
    expect(sorted.map((asset) => asset.name)).toEqual(['c.jar', 'a.jar', 'b.jar'])
  })
})

describe('validateReleasesFile', () => {
  it('accepts a minimal valid snapshot', () => {
    expect(
      validateReleasesFile({
        schemaVersion: 1,
        generatedAt: '2026-10-18T10:00:00Z',
        repo: 'CraftAmethyst/Luminara',
        releases: [makeRelease()],
      }),
    ).toEqual([])
  })

  it('rejects an empty release list and broken URLs', () => {
    const errors = validateReleasesFile({
      schemaVersion: 1,
      generatedAt: '2026-10-18T10:00:00Z',
      repo: 'CraftAmethyst/Luminara',
      releases: [
        makeRelease({
          htmlUrl: 'https://example.com/nope',
          assets: [
            {
              ...makeRelease().assets[0],
              downloadUrl: 'https://evil.example/file.jar',
            },
          ],
        }),
      ],
    })
    expect(errors.some((error) => error.includes('invalid htmlUrl'))).toBe(true)
    expect(
      errors.some((error) => error.includes('invalid downloadUrl')),
    ).toBe(true)
  })

  it('rejects duplicate asset names', () => {
    const asset = makeRelease().assets[0]
    const errors = validateReleasesFile({
      schemaVersion: 1,
      generatedAt: '2026-10-18T10:00:00Z',
      repo: 'CraftAmethyst/Luminara',
      releases: [makeRelease({ assets: [asset, { ...asset, id: 9 }] })],
    })
    expect(errors.some((error) => error.includes('duplicate asset name'))).toBe(
      true,
    )
  })
})
