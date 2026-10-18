import path from 'node:path'

export const REPO = 'CraftAmethyst/Luminara'
export const REPO_URL = `https://github.com/${REPO}`
export const RELEASES_URL = `${REPO_URL}/releases`

export const BRANCH_LOADERS = {
  trials: ['forge'],
  feudalkings: ['neoforge', 'fabric'],
}

export const BRANCH_MINECRAFT = {
  trials: '1.20.1',
  feudalkings: '1.21.1',
}

const LOADER_ORDER = { forge: 0, neoforge: 1, fabric: 2, unknown: 3 }
const COMPAT_ORDER = { supported: 0, unsupported: 1, unknown: 2 }

const TAG_PREFIXES = [
  { prefix: 'Trials', branch: 'trials', legacy: false },
  { prefix: 'FeudalKings', branch: 'feudalkings', legacy: false },
  { prefix: 'FK', branch: 'feudalkings', legacy: true },
]

export function resolveBranch(tag, targetCommitish) {
  for (const entry of TAG_PREFIXES) {
    if (tag.startsWith(`${entry.prefix}/`)) {
      return {
        branch: entry.branch,
        tagPrefix: entry.prefix,
        legacy: entry.legacy,
      }
    }
  }

  if (!/^\d/.test(tag)) return null

  if (targetCommitish === 'stable/Trials') {
    return { branch: 'trials', tagPrefix: null, legacy: true }
  }
  if (targetCommitish === 'stable/FeudalKings') {
    return { branch: 'feudalkings', tagPrefix: null, legacy: true }
  }
  return null
}

export function versionFromTag(tag) {
  const raw = tag.includes('/') ? tag.slice(tag.indexOf('/') + 1) : tag
  return raw.replace(/^a(?=\d)/, '')
}

export function numericVersionParts(version) {
  const match = String(version)
    .replace(/^a(?=\d)/, '')
    .match(/^\d+(?:\.\d+)*/)
  if (!match) return [0]
  return match[0].split('.').map(Number)
}

export function compareVersionParts(a, b) {
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0
    const right = b[index] ?? 0
    if (left !== right) return right - left
  }
  return 0
}

export function compareReleasesDesc(a, b) {
  const byVersion = compareVersionParts(
    numericVersionParts(a.version),
    numericVersionParts(b.version),
  )
  if (byVersion !== 0) return byVersion
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
}

export function parseAssetFilename(name) {
  const match = name.match(
    /^luminara-(?:(forge|neoforge|fabric)-)?(\d+\.\d+(?:\.\d+)?)-(.+)\.jar$/i,
  )
  if (!match) return null
  return {
    loader: match[1] ? match[1].toLowerCase() : null,
    minecraft: match[2],
    fileVersion: match[3],
  }
}

function parseDigest(digest) {
  const match = /^sha256:([0-9a-f]{64})$/i.exec(digest ?? '')
  return match ? match[1].toLowerCase() : null
}

export function normalizeAsset(apiAsset, branch) {
  const parsed = parseAssetFilename(apiAsset.name)

  let loader = 'unknown'
  let loaderSource = 'unknown'
  let minecraft = null
  let minecraftSource = 'branch-default'

  if (parsed) {
    minecraft = parsed.minecraft
    minecraftSource = 'filename'
    if (parsed.loader) {
      loader = parsed.loader
      loaderSource = 'filename'
    } else if (branch === 'trials') {
      loader = 'forge'
      loaderSource = 'branch-default'
    }
  }

  if (!minecraft) {
    minecraft = BRANCH_MINECRAFT[branch]
    minecraftSource = 'branch-default'
  }

  const compatibility =
    loader === 'unknown'
      ? 'unknown'
      : BRANCH_LOADERS[branch].includes(loader)
        ? 'supported'
        : 'unsupported'

  const digest = parseDigest(apiAsset.digest)

  return {
    id: apiAsset.id,
    name: apiAsset.name,
    size: apiAsset.size,
    downloadUrl: apiAsset.browser_download_url,
    loader,
    loaderSource,
    minecraft,
    minecraftSource,
    compatibility,
    checksum: digest
      ? { sha256: digest, source: 'github-digest', file: null }
      : null,
  }
}

export function sortAssets(assets) {
  return [...assets].sort((a, b) => {
    const byCompat = COMPAT_ORDER[a.compatibility] - COMPAT_ORDER[b.compatibility]
    if (byCompat !== 0) return byCompat
    const byLoader = LOADER_ORDER[a.loader] - LOADER_ORDER[b.loader]
    if (byLoader !== 0) return byLoader
    return a.name.localeCompare(b.name)
  })
}

function isChecksumAsset(name) {
  const lower = name.toLowerCase()
  return (
    lower.endsWith('.sha256') ||
    lower.endsWith('.sha256.txt') ||
    lower === 'sha256sums' ||
    lower === 'sha256sums.txt'
  )
}

export function normalizeRelease(apiRelease) {
  if (apiRelease.draft) return null

  const info = resolveBranch(
    apiRelease.tag_name,
    apiRelease.target_commitish,
  )
  if (!info) return null

  const allAssets = apiRelease.assets ?? []
  const jarAssets = allAssets.filter((asset) =>
    asset.name.toLowerCase().endsWith('.jar'),
  )
  const otherAssets = allAssets
    .filter(
      (asset) =>
        !asset.name.toLowerCase().endsWith('.jar') &&
        !isChecksumAsset(asset.name),
    )
    .map((asset) => asset.name)

  return {
    id: apiRelease.id,
    tag: apiRelease.tag_name,
    tagPrefix: info.tagPrefix,
    branch: info.branch,
    version: versionFromTag(apiRelease.tag_name),
    name: apiRelease.name ?? null,
    htmlUrl: apiRelease.html_url,
    publishedAt: apiRelease.published_at,
    prerelease: Boolean(apiRelease.prerelease),
    legacy: info.legacy,
    assets: sortAssets(
      jarAssets.map((asset) => normalizeAsset(asset, info.branch)),
    ),
    otherAssets,
  }
}

export function sortReleasesDesc(releases) {
  return [...releases].sort(compareReleasesDesc)
}

export function isValidDownloadUrl(url) {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'github.com' &&
      parsed.pathname.startsWith(`/${REPO}/releases/download/`)
    )
  } catch {
    return false
  }
}

function isValidReleaseUrl(url) {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'github.com' &&
      parsed.pathname.startsWith(`/${REPO}/releases/tag/`)
    )
  } catch {
    return false
  }
}

function isIsoDate(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isSha256(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value)
}

export function validateReleasesFile(data) {
  const errors = []

  if (!data || typeof data !== 'object') {
    return ['Snapshot must be an object']
  }
  if (data.schemaVersion !== 1) errors.push('schemaVersion must be 1')
  if (data.repo !== REPO) errors.push(`repo must be ${REPO}`)
  if (!isIsoDate(data.generatedAt)) errors.push('generatedAt must be an ISO date')
  if (!Array.isArray(data.releases) || data.releases.length === 0) {
    errors.push('releases must be a non-empty array')
    return errors
  }

  const branchCounts = { trials: 0, feudalkings: 0 }
  let supportedAssets = 0

  data.releases.forEach((release, releaseIndex) => {
    const where = `releases[${releaseIndex}] (${release?.tag ?? 'unknown'})`
    if (typeof release?.id !== 'number') errors.push(`${where}: id must be a number`)
    if (typeof release?.tag !== 'string' || release.tag.length === 0) {
      errors.push(`${where}: tag must be a non-empty string`)
    }
    if (!['Trials', 'FeudalKings', 'FK', null].includes(release?.tagPrefix)) {
      errors.push(`${where}: invalid tagPrefix`)
    }
    if (!['trials', 'feudalkings'].includes(release?.branch)) {
      errors.push(`${where}: invalid branch`)
    } else {
      branchCounts[release.branch] += 1
    }
    if (typeof release?.version !== 'string' || release.version.length === 0) {
      errors.push(`${where}: version must be a non-empty string`)
    }
    if (!isValidReleaseUrl(release?.htmlUrl)) {
      errors.push(`${where}: invalid htmlUrl`)
    }
    if (!isIsoDate(release?.publishedAt)) {
      errors.push(`${where}: publishedAt must be an ISO date`)
    }
    if (typeof release?.prerelease !== 'boolean') {
      errors.push(`${where}: prerelease must be a boolean`)
    }
    if (typeof release?.legacy !== 'boolean') {
      errors.push(`${where}: legacy must be a boolean`)
    }
    if (!Array.isArray(release?.assets)) {
      errors.push(`${where}: assets must be an array`)
      return
    }
    if (
      !Array.isArray(release?.otherAssets) ||
      release.otherAssets.some(
        (name) => typeof name !== 'string' || name.length === 0,
      )
    ) {
      errors.push(`${where}: otherAssets must be an array of names`)
    }

    const names = new Set()
    release.assets.forEach((asset, assetIndex) => {
      const assetWhere = `${where}.assets[${assetIndex}]`
      if (typeof asset?.id !== 'number') errors.push(`${assetWhere}: id must be a number`)
      if (typeof asset?.name !== 'string' || !asset.name.toLowerCase().endsWith('.jar')) {
        errors.push(`${assetWhere}: name must end with .jar`)
      } else if (names.has(asset.name)) {
        errors.push(`${assetWhere}: duplicate asset name ${asset.name}`)
      } else {
        names.add(asset.name)
      }
      if (!Number.isInteger(asset?.size) || asset.size <= 0) {
        errors.push(`${assetWhere}: size must be a positive integer`)
      }
      if (!isValidDownloadUrl(asset?.downloadUrl)) {
        errors.push(`${assetWhere}: invalid downloadUrl`)
      }
      if (!['forge', 'neoforge', 'fabric', 'unknown'].includes(asset?.loader)) {
        errors.push(`${assetWhere}: invalid loader`)
      }
      if (!['filename', 'branch-default', 'unknown'].includes(asset?.loaderSource)) {
        errors.push(`${assetWhere}: invalid loaderSource`)
      }
      if (asset?.minecraft !== null && typeof asset?.minecraft !== 'string') {
        errors.push(`${assetWhere}: invalid minecraft`)
      }
      if (!['filename', 'branch-default'].includes(asset?.minecraftSource)) {
        errors.push(`${assetWhere}: invalid minecraftSource`)
      }
      if (!['supported', 'unsupported', 'unknown'].includes(asset?.compatibility)) {
        errors.push(`${assetWhere}: invalid compatibility`)
      } else if (asset.compatibility === 'supported') {
        supportedAssets += 1
      }
      if (asset?.checksum !== null) {
        if (
          !asset?.checksum ||
          typeof asset.checksum !== 'object' ||
          !isSha256(asset.checksum.sha256) ||
          !['github-digest', 'asset-sha256', 'sums-file'].includes(
            asset.checksum.source,
          ) ||
          (asset.checksum.file !== null &&
            typeof asset.checksum.file !== 'string')
        ) {
          errors.push(`${assetWhere}: invalid checksum`)
        }
      }
    })

    const previous = data.releases[releaseIndex - 1]
    if (previous && compareReleasesDesc(previous, release) > 0) {
      errors.push(`${where}: releases are not sorted descending`)
    }

    const sortedAssets = sortAssets(release.assets)
    if (release.assets.some((asset, index) => asset !== sortedAssets[index])) {
      errors.push(`${where}: assets are not in canonical order`)
    }
  })

  if (branchCounts.trials === 0 && branchCounts.feudalkings === 0) {
    errors.push('at least one supported branch must have releases')
  }
  if (supportedAssets === 0) {
    errors.push('at least one supported downloadable asset is required')
  }

  return errors
}

export function checksumBasename(filename) {
  return path.posix.basename(filename)
}
