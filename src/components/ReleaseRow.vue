<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Release } from '@/types/releases'
import { formatDate } from '@/lib/format'
import {
  releaseStatus,
  statusBadgeClass,
} from '@/lib/release-status'
import { useI18n } from '@/i18n'
import AssetActions from './AssetActions.vue'
import AssetDetails from './AssetDetails.vue'
import DetailsToggle from './DetailsToggle.vue'
import ExternalIcon from './icons/ExternalIcon.vue'

const props = defineProps<{
  release: Release
  featured?: boolean
}>()

const { t, locale } = useI18n()

const status = computed(() => releaseStatus(props.release))
const statusClass = computed(() => statusBadgeClass(status.value))
const statusLabel = computed(() => t(status.value))
const zipOnly = computed(
  () =>
    props.release.otherAssets.length > 0 &&
    props.release.otherAssets.every((name) =>
      name.toLowerCase().endsWith('.zip'),
    ),
)

const expanded = ref(false)
const detailsId = computed(() => `row-details-${props.release.id}`)
</script>

<template>
  <article
    class="grid gap-2 border-b border-line px-3 py-3.5 sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-4"
    :class="featured ? 'bg-brand-wash' : ''"
  >
    <div class="min-w-0" data-column="version">
      <h3 class="text-base font-semibold tracking-tight tabular-nums">
        {{ release.version }}
      </h3>
      <p class="mt-0.5 text-[12px] text-ink-muted">
        {{ formatDate(release.publishedAt, locale) }}
      </p>
    </div>

    <div
      class="flex flex-wrap items-center gap-1.5 sm:justify-center"
      data-column="status"
    >
      <span v-if="featured" class="badge badge-brand">
        {{ t('latest') }}
      </span>
      <span class="badge" :class="statusClass">
        {{ statusLabel }}
      </span>
      <span v-if="release.legacy" class="badge badge-neutral">
        {{ t('legacy') }}
      </span>
      <span v-if="!release.assets.length && zipOnly" class="badge badge-warn">
        {{ t('onlyZip') }}
      </span>
      <span v-else-if="!release.assets.length" class="badge badge-warn">
        {{ t('noJarBadge') }}
      </span>
    </div>

    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end"
      data-column="download"
    >
      <DetailsToggle
        :expanded="expanded"
        :controls="detailsId"
        @toggle="expanded = !expanded"
      />
      <AssetActions
        v-for="asset in release.assets"
        :key="asset.id"
        :asset="asset"
      />
    </div>

    <div
      v-show="expanded"
      :id="detailsId"
      class="border-t border-line pt-1 sm:col-span-3"
      data-column="details"
    >
      <div v-if="release.assets.length" class="divide-y divide-line">
        <AssetDetails
          v-for="asset in release.assets"
          :key="asset.id"
          :asset="asset"
        />
      </div>
      <p
        v-else
        class="py-2 text-[12px] leading-relaxed text-ink-muted"
      >
        {{ t('noJar') }}
        <template v-if="release.otherAssets.length">
          · {{ release.otherAssets.join(', ') }}
        </template>
        <a
          class="text-link ml-1 inline-flex items-center gap-0.5"
          :href="release.htmlUrl"
          rel="noopener noreferrer"
        >
          {{ t('viewOnGithub') }}
          <ExternalIcon />
        </a>
      </p>
      <a
        class="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
        :href="release.htmlUrl"
        rel="noopener noreferrer"
      >
        {{ t('releaseNotes') }}
        <ExternalIcon />
      </a>
    </div>
  </article>
</template>
