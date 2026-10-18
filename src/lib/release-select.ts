import type {
  BranchId,
  Loader,
  Release,
  ReleaseAsset,
} from '@/types/releases'

export function supportedAssets(release: Release): ReleaseAsset[] {
  return release.assets.filter(
    (asset) => asset.compatibility === 'supported',
  )
}

export function latestStable(
  releases: Release[],
  branch: BranchId,
): Release | null {
  return (
    releases.find(
      (release) =>
        release.branch === branch &&
        !release.prerelease &&
        !release.legacy &&
        supportedAssets(release).length > 0,
    ) ?? null
  )
}

export function latestPrerelease(
  releases: Release[],
  branch: BranchId,
): Release | null {
  return (
    releases.find(
      (release) =>
        release.branch === branch &&
        release.prerelease &&
        supportedAssets(release).length > 0,
    ) ?? null
  )
}

export function heroRelease(
  releases: Release[],
  branch: BranchId,
): Release | null {
  return latestStable(releases, branch) ?? latestPrerelease(releases, branch)
}

export function releasesForBranch(
  releases: Release[],
  branch: BranchId,
): Release[] {
  return releases.filter((release) => release.branch === branch)
}

export function loadersForRelease(release: Release | null): Loader[] {
  if (!release) return []
  const loaders = new Set<Loader>()
  for (const asset of supportedAssets(release)) {
    if (asset.loader !== 'unknown') loaders.add(asset.loader)
  }
  return [...loaders]
}
