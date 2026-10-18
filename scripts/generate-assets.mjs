#!/usr/bin/env node

import fs from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import sharp from 'sharp'

const logoPath = fileURLToPath(
  new URL('../src/assets/brand/logo-rounded.png', import.meta.url),
)
const bannerPath = fileURLToPath(
  new URL('../src/assets/brand/banner.png', import.meta.url),
)
const publicDir = fileURLToPath(new URL('../public', import.meta.url))

await fs.mkdir(publicDir, { recursive: true })

const icons = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-512.png', 512],
]

for (const [filename, size] of icons) {
  await sharp(logoPath)
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9 })
    .toFile(`${publicDir}/${filename}`)
  console.log(`Generated public/${filename}`)
}

const logo64Path = fileURLToPath(
  new URL('../src/assets/brand/logo-64.png', import.meta.url),
)
await sharp(logoPath)
  .resize(64, 64, { fit: 'cover' })
  .png({ compressionLevel: 9 })
  .toFile(logo64Path)
console.log('Generated src/assets/brand/logo-64.png')

const banner = await sharp(bannerPath).resize({ width: 1200 }).png().toBuffer()
const bannerMeta = await sharp(banner).metadata()
const top = Math.max(0, Math.round((630 - (bannerMeta.height ?? 0)) / 2))

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([{ input: banner, top, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(`${publicDir}/og-image.png`)

console.log('Generated public/og-image.png (1200x630)')
