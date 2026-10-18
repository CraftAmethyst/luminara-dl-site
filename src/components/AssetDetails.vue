<script setup lang="ts">
import type { ReleaseAsset } from '@/types/releases'
import { formatBytes, loaderLabel } from '@/lib/format'
import { useI18n } from '@/i18n'
import ChecksumLine from './ChecksumLine.vue'

const props = defineProps<{ asset: ReleaseAsset }>()
const { t } = useI18n()
</script>

<template>
  <div class="py-2">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span class="text-[12px] font-semibold">
        {{ loaderLabel(props.asset.loader) }}
      </span>
      <span
        v-if="props.asset.minecraft"
        class="text-[11px] text-ink-muted"
      >
        Minecraft {{ props.asset.minecraft }}
      </span>
      <span class="text-line-strong" aria-hidden="true">·</span>
      <span class="text-[11px] text-ink-muted">
        {{ formatBytes(props.asset.size) }}
      </span>
    </div>
    <p class="file-name mono mt-0.5 text-[11px] text-ink-muted">
      {{ props.asset.name }}
    </p>
    <div class="mt-1.5">
      <ChecksumLine :checksum="props.asset.checksum" />
    </div>
    <p
      v-if="props.asset.compatibility !== 'supported'"
      class="mt-1 text-[11px] leading-relaxed text-danger"
    >
      {{ t('unsupportedHint') }}
    </p>
  </div>
</template>
