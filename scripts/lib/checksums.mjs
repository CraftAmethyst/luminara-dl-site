import path from 'node:path'

/**
 * Parse a checksum file and resolve the digest for one JAR.
 *
 * Supported formats:
 *   <hash>  <filename>
 *   <hash> *<filename>
 *   SHA256 (<filename>) = <hash>
 *
 * Filenames are matched by basename because SHA256SUMS may contain build paths.
 */
export function parseChecksumText(text, jarName, { allowSingleLine = false } = {}) {
  const target = path.posix.basename(jarName)
  const entries = []

  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    let match = line.match(/^([a-fA-F0-9]{64})\s+\*?(.+)$/)
    if (match) {
      entries.push({
        hash: match[1].toLowerCase(),
        file: path.posix.basename(match[2].trim()),
      })
      continue
    }

    match = line.match(/^SHA256\s*\((.+)\)\s*=\s*([a-fA-F0-9]{64})$/i)
    if (match) {
      entries.push({
        hash: match[2].toLowerCase(),
        file: path.posix.basename(match[1].trim()),
      })
    }
  }

  const exact = entries.find((entry) => entry.file === target)
  if (exact) return exact.hash

  if (allowSingleLine && entries.length === 1) {
    return entries[0].hash
  }

  if (allowSingleLine) {
    const hashes = String(text).match(/\b[a-fA-F0-9]{64}\b/g)
    if (hashes && hashes.length === 1) return hashes[0].toLowerCase()
  }

  return null
}

function findAsset(assets, name) {
  return (
    assets.find((asset) => asset.name === name) ??
    assets.find((asset) => asset.name.toLowerCase() === name.toLowerCase()) ??
    null
  )
}

/**
 * Resolve a JAR digest from its sibling checksum asset or a global sums file.
 * Returns null when no checksum can be resolved; never downloads the JAR.
 */
export async function resolveChecksum(
  releaseAssets,
  jarAsset,
  fetchText,
  { warn = () => {} } = {},
) {
  const perJarNames = [
    `${jarAsset.name}.sha256`,
    `${jarAsset.name}.sha256.txt`,
  ]
  const globalNames = ['SHA256SUMS', 'sha256sums.txt', 'sha256sums']

  for (const name of perJarNames) {
    const asset = findAsset(releaseAssets, name)
    if (!asset) continue
    try {
      const text = await fetchText(asset.browser_download_url)
      const hash = parseChecksumText(text, jarAsset.name, {
        allowSingleLine: true,
      })
      if (hash) {
        return { sha256: hash, source: 'asset-sha256', file: asset.name }
      }
      warn(`No checksum entry for ${jarAsset.name} in ${asset.name}`)
    } catch (error) {
      warn(`Could not read ${asset.name}: ${error.message}`)
    }
  }

  for (const name of globalNames) {
    const asset = findAsset(releaseAssets, name)
    if (!asset) continue
    try {
      const text = await fetchText(asset.browser_download_url)
      const hash = parseChecksumText(text, jarAsset.name, {
        allowSingleLine: false,
      })
      if (hash) {
        return { sha256: hash, source: 'sums-file', file: asset.name }
      }
      warn(`No checksum entry for ${jarAsset.name} in ${asset.name}`)
    } catch (error) {
      warn(`Could not read ${asset.name}: ${error.message}`)
    }
  }

  return null
}
