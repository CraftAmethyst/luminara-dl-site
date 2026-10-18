<script setup lang="ts">
import { ref } from 'vue'
import releasesData from '@/data/releases.json'
import type { BranchId, ReleasesFile } from '@/types/releases'
import { provideI18n } from '@/i18n'
import { BRANCH_ORDER } from '@/content/branches'
import SiteHeader from './components/SiteHeader.vue'
import VersionHistory from './components/VersionHistory.vue'
import BranchTabs from './components/BranchTabs.vue'
import SiteFooter from './components/SiteFooter.vue'
import DownloadDialog from './components/DownloadDialog.vue'

const props = defineProps<{ locale: 'zh' | 'en' }>()
const { t } = provideI18n(props.locale)

const data = releasesData as ReleasesFile

function initialBranch(): BranchId {
  if (typeof window === 'undefined') return BRANCH_ORDER[0]
  const value = new URLSearchParams(window.location.search).get('branch')
  return value === 'feudalkings' ? 'feudalkings' : BRANCH_ORDER[0]
}

const branch = ref<BranchId>(initialBranch())

function selectBranch(value: BranchId) {
  branch.value = value
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (value === 'trials') {
    url.searchParams.delete('branch')
  } else {
    url.searchParams.set('branch', value)
  }
  window.history.replaceState(null, '', url)
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-white"
    >
      {{ t('skipToContent') }}
    </a>

    <SiteHeader :locale="locale" :branch="branch" />

    <main id="main" class="flex-1">
      <div class="container-page pb-14 pt-9 sm:pt-12">
        <div
          class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
              {{ t('pageTitle') }}
            </h1>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-3">
            <BranchTabs
              :model-value="branch"
              @update:model-value="selectBranch"
            />
          </div>
        </div>

        <VersionHistory
          class="mt-8"
          :releases="data.releases"
          :branch="branch"
        />
      </div>
    </main>

    <SiteFooter :generated-at="data.generatedAt" />
    <DownloadDialog />
  </div>
</template>
