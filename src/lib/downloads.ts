import type { ReleaseAsset } from '@/types/releases'

export const PROXIES = [
  { id: 'ghfast', label: 'ghfast.top', prefix: 'https://ghfast.top/' },
  { id: 'gh-proxy', label: 'gh-proxy.com', prefix: 'https://gh-proxy.com/' },
  { id: 'ghproxy', label: 'ghproxy.net', prefix: 'https://ghproxy.net/' },
] as const

export type ProxyId = (typeof PROXIES)[number]['id']

const STORAGE_KEY = 'luminara.download-proxy'

export function isProxyId(value: unknown): value is ProxyId {
  return PROXIES.some((proxy) => proxy.id === value)
}

export function buildAcceleratedUrl(
  githubUrl: string,
  proxyId: ProxyId,
): string {
  const parsed = new URL(githubUrl)
  if (
    parsed.protocol !== 'https:' ||
    parsed.hostname !== 'github.com' ||
    !parsed.pathname.startsWith(
      '/CraftAmethyst/Luminara/releases/download/',
    )
  ) {
    throw new Error('Unexpected download origin')
  }

  const proxy = PROXIES.find((entry) => entry.id === proxyId)
  if (!proxy) throw new Error('Unknown proxy')

  return `${proxy.prefix}${parsed.href}`
}

export function tryBuildAcceleratedUrl(
  githubUrl: string,
  proxyId: ProxyId,
): string | null {
  try {
    return buildAcceleratedUrl(githubUrl, proxyId)
  } catch {
    return null
  }
}

export function readStoredProxy(): ProxyId {
  if (typeof localStorage === 'undefined') return 'ghfast'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isProxyId(stored) ? stored : 'ghfast'
  } catch {
    return 'ghfast'
  }
}

export function writeStoredProxy(proxyId: ProxyId): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, proxyId)
  } catch {
    // Storage can be unavailable in private windows; the in-memory value still works.
  }
}

export function proxyLabel(proxyId: ProxyId): string {
  return PROXIES.find((proxy) => proxy.id === proxyId)?.label ?? proxyId
}

export function assetAcceleration(
  asset: ReleaseAsset,
  proxyId: ProxyId,
): string | null {
  return tryBuildAcceleratedUrl(asset.downloadUrl, proxyId)
}
