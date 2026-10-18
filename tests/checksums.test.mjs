import { describe, expect, it, vi } from 'vitest'
import {
  parseChecksumText,
  resolveChecksum,
} from '../scripts/lib/checksums.mjs'

const HASH = 'a'.repeat(64)
const OTHER = 'b'.repeat(64)

describe('parseChecksumText', () => {
  it('parses the two-space format', () => {
    expect(
      parseChecksumText(`${HASH}  luminara-forge-1.20.1-1.0.16.jar`, 'luminara-forge-1.20.1-1.0.16.jar'),
    ).toBe(HASH)
  })

  it('parses binary-mode and uppercase hashes', () => {
    expect(
      parseChecksumText(
        `${HASH.toUpperCase()} *luminara-1.20.1-1.0.15.jar`,
        'luminara-1.20.1-1.0.15.jar',
      ),
    ).toBe(HASH)
  })

  it('parses the BSD-style line', () => {
    expect(
      parseChecksumText(
        `SHA256 (luminara-1.20.1-1.0.15.jar) = ${HASH}`,
        'luminara-1.20.1-1.0.15.jar',
      ),
    ).toBe(HASH)
  })

  it('matches SHA256SUMS entries by basename', () => {
    const text = [
      `${OTHER}  build/distributions/other.jar`,
      `${HASH}  build/distributions/luminara-forge-1.20.1-1.0.16.jar`,
    ].join('\n')
    expect(
      parseChecksumText(
        text,
        'luminara-forge-1.20.1-1.0.16.jar',
        { allowSingleLine: false },
      ),
    ).toBe(HASH)
  })

  it('accepts a single hash-only line for a per-JAR file', () => {
    expect(parseChecksumText(HASH, 'file.jar', { allowSingleLine: true })).toBe(
      HASH,
    )
  })

  it('does not accept a single hash-only line for a sums file', () => {
    expect(
      parseChecksumText(HASH, 'file.jar', { allowSingleLine: false }),
    ).toBeNull()
  })

  it('returns null when no filename matches', () => {
    expect(
      parseChecksumText(`${HASH}  other.jar`, 'file.jar'),
    ).toBeNull()
  })
})

describe('resolveChecksum', () => {
  it('uses a sibling .sha256 asset first', async () => {
    const asset = {
      name: 'luminara-forge-1.20.1-1.0.16.jar.sha256',
      browser_download_url: 'https://example.test/sha',
    }
    const fetchText = vi.fn(
      async () => `${HASH}  luminara-forge-1.20.1-1.0.16.jar`,
    )
    await expect(
      resolveChecksum(
        [asset],
        { name: 'luminara-forge-1.20.1-1.0.16.jar' },
        fetchText,
      ),
    ).resolves.toEqual({
      sha256: HASH,
      source: 'asset-sha256',
      file: asset.name,
    })
  })

  it('falls back to SHA256SUMS', async () => {
    const asset = {
      name: 'SHA256SUMS',
      browser_download_url: 'https://example.test/sums',
    }
    const fetchText = vi.fn(
      async () =>
        `${HASH}  build/distributions/luminara-neoforge-1.21.1-1.0.15-beta.1.jar\n` +
        `${OTHER}  build/distributions/luminara-fabric-1.21.1-1.0.15-beta.1.jar`,
    )
    await expect(
      resolveChecksum(
        [asset],
        { name: 'luminara-neoforge-1.21.1-1.0.15-beta.1.jar' },
        fetchText,
      ),
    ).resolves.toEqual({
      sha256: HASH,
      source: 'sums-file',
      file: 'SHA256SUMS',
    })
  })

  it('returns null and warns when the fetch fails', async () => {
    const warn = vi.fn()
    const asset = {
      name: 'SHA256SUMS',
      browser_download_url: 'https://example.test/sums',
    }
    await expect(
      resolveChecksum(
        [asset],
        { name: 'file.jar' },
        async () => {
          throw new Error('network down')
        },
        { warn },
      ),
    ).resolves.toBeNull()
    expect(warn).toHaveBeenCalled()
  })
})
