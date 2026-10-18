<script setup lang="ts">
import type { ReleaseAsset } from '@/types/releases'
import { loaderLabel } from '@/lib/format'
import { openDownloadDialog } from '@/lib/download-dialog'
import { useI18n } from '@/i18n'
import LoaderLogo from './LoaderLogo.vue'

const props = defineProps<{ asset: ReleaseAsset }>()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="btn btn-primary btn-compact"
    :aria-label="t('downloadForLoader', {
      loader: loaderLabel(props.asset.loader),
    })"
    @click="openDownloadDialog(props.asset)"
  >
    <LoaderLogo :loader="props.asset.loader" class="h-4 w-4" invert />
    <span>{{ t('download') }}</span>
  </button>
</template>
