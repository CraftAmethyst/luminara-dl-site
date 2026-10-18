import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import type { Plugin } from 'vite'
import type { ReleasesFile } from '../src/types/releases.ts'

interface SeoPluginOptions {
  siteUrl: string
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function readGeneratedAt(): string {
  try {
    const path = fileURLToPath(new URL('../src/data/releases.json', import.meta.url))
    const data = JSON.parse(readFileSync(path, 'utf8')) as ReleasesFile
    return data.generatedAt
  } catch {
    return new Date().toISOString()
  }
}

export function seoPlugin({ siteUrl }: SeoPluginOptions): Plugin {
  const lastmod = readGeneratedAt().slice(0, 10)

  return {
    name: 'luminara-seo',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replaceAll('%SITE_URL%', siteUrl)
      },
    },
    generateBundle() {
      const zh = `${siteUrl}/`
      const origin = escapeXml(siteUrl)

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${origin}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>
  </url>
  <url>
    <loc>${origin}/en/</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="zh-CN" href="${origin}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>
  </url>
</urlset>
`

      const robots = `User-agent: *
Allow: /

Sitemap: ${zh}sitemap.xml
`

      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
    },
  }
}
