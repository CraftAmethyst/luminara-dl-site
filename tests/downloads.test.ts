import { describe, expect, it } from 'vitest'
import {
  PROXIES,
  buildAcceleratedUrl,
  tryBuildAcceleratedUrl,
} from '@/lib/downloads'

const ASSET_URL =
  'https://github.com/CraftAmethyst/Luminara/releases/download/' +
  'Trials/1.0.16/luminara-forge-1.20.1-1.0.16.jar'

describe('buildAcceleratedUrl', () => {
  it('prefixes the full GitHub URL for every mirror', () => {
    for (const proxy of PROXIES) {
      expect(buildAcceleratedUrl(ASSET_URL, proxy.id)).toBe(
        `${proxy.prefix}${ASSET_URL}`,
      )
    }
  })

  it('keeps tag slashes intact', () => {
    const url = buildAcceleratedUrl(ASSET_URL, 'ghfast')
    expect(url).toContain('/releases/download/Trials/1.0.16/')
    expect(url).not.toContain('Trials%2F')
  })

  it('rejects unexpected origins', () => {
    expect(() =>
      buildAcceleratedUrl('https://example.com/file.jar', 'ghfast'),
    ).toThrow('Unexpected download origin')
    expect(() =>
      buildAcceleratedUrl(
        'https://github.com/other/repo/releases/download/v1/file.jar',
        'ghfast',
      ),
    ).toThrow('Unexpected download origin')
  })

  it('returns null instead of throwing in the safe helper', () => {
    expect(tryBuildAcceleratedUrl('not a url', 'ghfast')).toBeNull()
  })
})
