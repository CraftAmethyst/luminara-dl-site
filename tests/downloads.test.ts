import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PROXIES,
  buildAcceleratedUrl,
  isProxyId,
  readStoredProxy,
  tryBuildAcceleratedUrl,
  writeStoredProxy,
} from '@/lib/downloads'

const ASSET_URL =
  'https://github.com/CraftAmethyst/Luminara/releases/download/' +
  'Trials/1.0.16/luminara-forge-1.20.1-1.0.16.jar'

afterEach(() => {
  vi.unstubAllGlobals()
})

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

describe('proxy persistence', () => {
  it('defaults to ghfast without localStorage', () => {
    expect(readStoredProxy()).toBe('ghfast')
  })

  it('round-trips a valid proxy and rejects invalid values', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    })

    writeStoredProxy('gh-proxy')
    expect(readStoredProxy()).toBe('gh-proxy')

    store.set('luminara.download-proxy', 'not-a-proxy')
    expect(readStoredProxy()).toBe('ghfast')
  })
})

describe('isProxyId', () => {
  it('accepts known ids only', () => {
    expect(isProxyId('ghfast')).toBe(true)
    expect(isProxyId('gh-proxy')).toBe(true)
    expect(isProxyId('ghproxy')).toBe(true)
    expect(isProxyId('moeyy')).toBe(false)
    expect(isProxyId(null)).toBe(false)
  })
})
