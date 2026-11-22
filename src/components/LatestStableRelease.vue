<script setup lang="ts">
import { computed } from 'vue'
import type { Release } from '@/types/releases'
import { useI18n } from '@/i18n'
import { formatDate } from '@/lib/format'
import { supportedAssets } from '@/lib/release-select'
import AssetActions from './AssetActions.vue'
import ExternalIcon from './icons/ExternalIcon.vue'

const props = defineProps<{ release: Release }>()
const { t, locale } = useI18n()
const assets = computed(() => supportedAssets(props.release))
</script>

<template>
  <section
    aria-labelledby="latest-stable-title"
    class="card flex flex-col gap-4 border-brand/25 bg-brand-wash p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
  >
    <div class="min-w-0">
      <h2 id="latest-stable-title" class="text-sm font-semibold text-brand-ink">
        {{ t('latestStable') }}
      </h2>
      <p class="mt-0.5 wrap-anywhere text-2xl font-semibold tracking-tight tabular-nums">
        {{ release.version }}
      </p>
      <div class="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-ink-muted">
        <time :datetime="release.publishedAt">
          {{ formatDate(release.publishedAt, locale) }}
        </time>
        <a
          class="text-link inline-flex items-center gap-1"
          :href="release.htmlUrl"
          rel="noopener noreferrer"
        >
          {{ t('releaseNotes') }}
          <ExternalIcon />
        </a>
      </div>
    </div>

    <div class="flex flex-wrap gap-2 sm:justify-end">
      <AssetActions v-for="asset in assets" :key="asset.id" :asset="asset" show-loader />
    </div>
  </section>
</template>
