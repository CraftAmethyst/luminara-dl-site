import type { Release } from '@/types/releases'

export type ReleaseStatus = 'stable' | 'experimental' | 'prerelease'

const ALPHA_TEXT = /alpha/i
const ALPHA_TAG = /(?:^|\/)a\d/i

export function isExperimentalRelease(release: Release): boolean {
  if (
    ALPHA_TEXT.test(release.version) ||
    ALPHA_TEXT.test(release.tag) ||
    ALPHA_TEXT.test(release.name ?? '') ||
    ALPHA_TAG.test(release.tag)
  ) {
    return true
  }
  return release.assets.some((asset) => ALPHA_TEXT.test(asset.name))
}

export function releaseStatus(release: Release): ReleaseStatus {
  if (isExperimentalRelease(release)) return 'experimental'
  return release.prerelease ? 'prerelease' : 'stable'
}

export function statusBadgeClass(status: ReleaseStatus): string {
  switch (status) {
    case 'stable':
      return 'badge-success'
    case 'experimental':
      return 'badge-experimental'
    default:
      return 'badge-warn'
  }
}
