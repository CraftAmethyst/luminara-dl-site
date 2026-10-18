const API_ROOT = 'https://api.github.com'
const USER_AGENT = 'luminara-download-site-builder'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function apiHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchJson(url, token, { retries = 2, timeout = 20000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    let response
    try {
      response = await fetch(url, {
        headers: apiHeaders(token),
        signal: AbortSignal.timeout(timeout),
      })
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Request failed for ${url}: ${error.message}`)
      }
      await sleep(1000 * (attempt + 1))
      continue
    }

    if (response.ok) return response.json()

    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining')
      if (remaining === '0') {
        const reset = Number(response.headers.get('x-ratelimit-reset') ?? 0)
        const when = reset ? new Date(reset * 1000).toISOString() : 'unknown'
        throw new Error(
          `GitHub API rate limit exhausted; resets at ${when}. ` +
            'Set GITHUB_TOKEN to raise the limit.',
        )
      }
    }

    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      const retryAfter = Number(response.headers.get('retry-after') ?? 0)
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1))
      continue
    }

    const body = await response.text().catch(() => '')
    throw new Error(
      `GitHub API ${response.status} ${response.statusText} for ${url}` +
        (body ? `: ${body.slice(0, 300)}` : ''),
    )
  }

  throw new Error(`Request failed for ${url}`)
}

export async function fetchReleases(token, { maxPages = 5 } = {}) {
  const releases = []
  for (let page = 1; page <= maxPages; page += 1) {
    const url =
      `${API_ROOT}/repos/CraftAmethyst/Luminara/releases` +
      `?per_page=100&page=${page}`
    const batch = await fetchJson(url, token)
    if (!Array.isArray(batch)) {
      throw new Error(`Unexpected GitHub API response for ${url}`)
    }
    releases.push(...batch)
    if (batch.length < 100) break
  }
  return releases
}

export async function fetchText(
  url,
  { timeout = 15000, maxBytes = 65536 } = {},
) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }

  const declaredLength = Number(response.headers.get('content-length') ?? 0)
  if (declaredLength > maxBytes) {
    throw new Error(`Checksum file is too large (${declaredLength} bytes)`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.byteLength > maxBytes) {
    throw new Error(`Checksum file is too large (${buffer.byteLength} bytes)`)
  }

  return buffer.toString('utf8')
}
