export const PROXIES = [
  { id: 'ghfast', label: 'ghfast.top', prefix: 'https://ghfast.top/' },
  { id: 'gh-proxy', label: 'gh-proxy.com', prefix: 'https://gh-proxy.com/' },
  { id: 'ghproxy', label: 'ghproxy.net', prefix: 'https://ghproxy.net/' },
] as const

export type ProxyId = (typeof PROXIES)[number]['id']

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
