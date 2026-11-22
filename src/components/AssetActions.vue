<script setup lang="ts">
import { computed } from 'vue'
import type { ReleaseAsset } from '@/types/releases'
import { loaderLabel } from '@/lib/format'
import { openDownloadDialog } from '@/lib/download-dialog'
import { useI18n } from '@/i18n'
import LoaderLogo from './LoaderLogo.vue'

const props = defineProps<{ asset: ReleaseAsset; showLoader?: boolean }>()
const { t } = useI18n()
const downloadLabel = computed(() =>
  t('downloadForLoader', { loader: loaderLabel(props.asset.loader) }),
)
</script>

<template>
  <button
    type="button"
    class="btn btn-primary"
    :class="{ 'btn-compact': !showLoader }"
    :aria-label="downloadLabel"
    @click="openDownloadDialog(props.asset)"
  >
    <LoaderLogo :loader="props.asset.loader" class="h-4 w-4" invert />
    <span>{{ showLoader ? downloadLabel : t('download') }}</span>
  </button>
</template>
