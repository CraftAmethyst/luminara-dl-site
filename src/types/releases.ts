export type BranchId = 'trials' | 'feudalkings'
export type Loader = 'forge' | 'neoforge' | 'fabric' | 'unknown'

export interface Checksum {
  sha256: string
  source: 'github-digest' | 'asset-sha256' | 'sums-file'
  file: string | null
}

export interface ReleaseAsset {
  id: number
  name: string
  size: number
  downloadUrl: string
  loader: Loader
  loaderSource: 'filename' | 'branch-default' | 'unknown'
  minecraft: string | null
  minecraftSource: 'filename' | 'branch-default'
  compatibility: 'supported' | 'unsupported' | 'unknown'
  checksum: Checksum | null
}

export interface Release {
  id: number
  tag: string
  tagPrefix: 'Trials' | 'FeudalKings' | 'FK' | null
  branch: BranchId
  version: string
  name: string | null
  htmlUrl: string
  publishedAt: string
  prerelease: boolean
  legacy: boolean
  assets: ReleaseAsset[]
  otherAssets: string[]
}

export interface ReleasesFile {
  schemaVersion: 1
  generatedAt: string
  repo: 'CraftAmethyst/Luminara'
  releases: Release[]
}
