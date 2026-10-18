export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const megabytes = bytes / 1_000_000
  const digits = megabytes >= 10 ? 1 : 2
  return `${megabytes.toFixed(digits)} MB`
}

export function formatDate(iso: string, locale: 'zh' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatTimestamp(iso: string, locale: 'zh' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const formatted = new Intl.DateTimeFormat(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    },
  ).format(date)
  return `${formatted} UTC`
}

export function shortHash(hash: string): string {
  if (hash.length <= 22) return hash
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}

export function loaderLabel(loader: string): string {
  switch (loader) {
    case 'forge':
      return 'Forge'
    case 'neoforge':
      return 'NeoForge'
    case 'fabric':
      return 'Fabric'
    default:
      return 'Unknown'
  }
}
