<script setup lang="ts">
import { computed } from 'vue'
import type { BranchId, Release } from '@/types/releases'
import { heroRelease, releasesForBranch } from '@/lib/release-select'
import { BRANCH_PATHS } from '@/content/branches'
import { useI18n } from '@/i18n'
import ReleaseRow from './ReleaseRow.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps<{
  releases: Release[]
  branch: BranchId
}>()

const { t } = useI18n()
const list = computed(() => releasesForBranch(props.releases, props.branch))
const hero = computed(() => heroRelease(props.releases, props.branch))
</script>

<template>
  <section id="history" class="border-t border-line pt-7">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="text-base font-semibold tracking-tight">
        {{ t('historyTitle') }}
      </h2>
      <p class="text-[12px] text-ink-muted">
        {{ BRANCH_PATHS[branch] }} ·
        {{ t('releaseCount', { n: list.length }) }}
      </p>
    </div>

    <div class="mt-3">
      <div
        class="hidden border-y border-line bg-subtle px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:grid sm:grid-cols-3 sm:gap-4"
      >
        <span>{{ t('columnVersion') }}</span>
        <span class="text-center">{{ t('columnStatus') }}</span>
        <span class="text-right">{{ t('columnDownload') }}</span>
      </div>

      <div v-if="list.length" class="border-t border-line sm:border-t-0">
        <ReleaseRow
          v-for="release in list"
          :key="release.id"
          :release="release"
          :featured="release.id === hero?.id"
        />
      </div>
      <EmptyState v-else class="mt-6" :title="t('noReleases')" />
    </div>
  </section>
</template>
