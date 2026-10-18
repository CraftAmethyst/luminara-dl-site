import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { seoPlugin } from './build/seo-plugin.ts'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawSiteUrl = env.SITE_URL || (command === 'serve' ? 'http://localhost:5173' : '')
  const siteUrl = rawSiteUrl.replace(/\/+$/, '')

  if (command === 'build' && !/^https:\/\/[^/]+/.test(siteUrl)) {
    throw new Error(
      'SITE_URL must be an absolute HTTPS URL for production builds. ' +
        'Set it in .env.local or in the Cloudflare Pages environment.',
    )
  }

  return {
    appType: 'mpa',
    plugins: [vue(), tailwindcss(), seoPlugin({ siteUrl })],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        input: {
          zh: fileURLToPath(new URL('./index.html', import.meta.url)),
          en: fileURLToPath(new URL('./en/index.html', import.meta.url)),
        },
      },
    },
  }
})
