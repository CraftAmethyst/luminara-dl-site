<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { assetAcceleration, proxyLabel } from '@/lib/downloads'
import { selectedProxy } from '@/lib/proxy-store'
import { closeDownloadDialog, dialogAsset } from '@/lib/download-dialog'
import { formatBytes, loaderLabel } from '@/lib/format'
import { useI18n } from '@/i18n'
import GithubIcon from './icons/GithubIcon.vue'
import BoltIcon from './icons/BoltIcon.vue'
import CloseIcon from './icons/CloseIcon.vue'
import LoaderLogo from './LoaderLogo.vue'

const { t } = useI18n()

const dialogEl = ref<HTMLDialogElement | null>(null)
const asset = computed(() => dialogAsset.value)
const accelerated = computed(() =>
  asset.value ? assetAcceleration(asset.value, selectedProxy.value) : null,
)
const currentProxy = computed(() => proxyLabel(selectedProxy.value))

watch(
  dialogAsset,
  (value) => {
    const dialog = dialogEl.value
    if (!dialog) return
    if (value && !dialog.open) {
      dialog.showModal()
    } else if (!value && dialog.open) {
      dialog.close()
    }
  },
  { flush: 'post' },
)

function close() {
  closeDownloadDialog()
}

function onClose() {
  closeDownloadDialog()
}

function onDialogClick(event: MouseEvent) {
  if (event.target === dialogEl.value) close()
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogEl"
      class="download-dialog m-auto max-h-[90vh] w-[min(92vw,440px)] overflow-y-auto rounded-[14px] border border-line bg-paper p-0 text-ink shadow-2xl"
      aria-labelledby="download-dialog-title"
      @close="onClose"
      @click="onDialogClick"
    >
      <template v-if="asset">
        <div
          class="flex items-start justify-between gap-3 border-b border-line px-5 py-4"
        >
          <div class="min-w-0">
            <h2
              id="download-dialog-title"
              class="text-base font-semibold tracking-tight"
            >
              {{ t('downloadDialogTitle') }}
            </h2>
            <div class="mt-1.5 flex items-center gap-2">
              <LoaderLogo :loader="asset.loader" class="h-5 w-5" />
              <span class="text-[12px] font-semibold">
                {{ loaderLabel(asset.loader) }}
              </span>
              <span class="text-[11px] text-ink-muted">
                · {{ formatBytes(asset.size) }}
              </span>
            </div>
            <p
              class="file-name mono mt-1 text-[11px] leading-relaxed text-ink-muted"
            >
              {{ asset.name }}
            </p>
          </div>
          <button
            type="button"
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-subtle hover:text-ink"
            :aria-label="t('close')"
            @click="close"
          >
            <CloseIcon />
          </button>
        </div>

        <div class="space-y-2 px-5 py-4">
          <a
            class="flex items-center gap-3 rounded-[10px] border border-ink bg-ink px-4 py-3 text-white transition-colors hover:bg-[#1b2c42]"
            :href="asset.downloadUrl"
            rel="noopener noreferrer"
            @click="close"
          >
            <GithubIcon class="h-5 w-5 shrink-0" />
            <span class="min-w-0">
              <span class="block text-sm font-semibold">
                {{ t('downloadGithub') }}
              </span>
              <span class="block text-[11px] text-white/70">
                {{ t('githubOptionHint') }}
              </span>
            </span>
          </a>

          <a
            v-if="accelerated"
            class="flex items-center gap-3 rounded-[10px] border border-line-strong px-4 py-3 text-ink transition-colors hover:bg-subtle"
            :href="accelerated"
            rel="noopener noreferrer"
            @click="close"
          >
            <BoltIcon class="h-5 w-5 shrink-0" />
            <span class="min-w-0">
              <span class="block text-sm font-semibold">
                {{ t('downloadAccel') }}
              </span>
              <span class="block text-[11px] text-ink-muted">
                {{ t('mirrorOptionHint', { proxy: currentProxy }) }}
              </span>
            </span>
          </a>
          <span
            v-else
            class="flex items-center gap-3 rounded-[10px] border border-line-strong px-4 py-3 text-ink-muted opacity-50"
            aria-disabled="true"
          >
            <BoltIcon class="h-5 w-5 shrink-0" />
            <span class="text-sm font-semibold">{{ t('downloadAccel') }}</span>
          </span>
        </div>

        <div class="flex justify-end border-t border-line px-5 py-3">
          <button
            type="button"
            class="text-xs text-ink-muted transition-colors hover:text-ink"
            @click="close"
          >
            {{ t('cancel') }}
          </button>
        </div>
      </template>
    </dialog>
  </Teleport>
</template>

<style scoped>
.download-dialog::backdrop {
  background: rgba(13, 26, 44, 0.32);
}
</style>
