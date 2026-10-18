<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { Checksum } from '@/types/releases'
import { copyText } from '@/lib/clipboard'
import { shortHash } from '@/lib/format'
import { useI18n } from '@/i18n'
import CopyIcon from './icons/CopyIcon.vue'
import CheckIcon from './icons/CheckIcon.vue'

const props = defineProps<{ checksum: Checksum | null }>()
const { t } = useI18n()

const state = ref<'idle' | 'copied' | 'failed'>('idle')
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  if (!props.checksum) return
  const copied = await copyText(props.checksum.sha256)
  state.value = copied ? 'copied' : 'failed'
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    state.value = 'idle'
  }, 2200)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <div class="text-xs">
    <div
      v-if="checksum"
      class="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted"
    >
      <span class="font-medium text-ink">{{ t('checksum') }}</span>
      <code class="mono" :title="checksum.sha256">
        {{ shortHash(checksum.sha256) }}
      </code>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded px-1 py-0.5 text-ink-muted transition-colors hover:text-ink"
        :aria-label="t('copyChecksum')"
        @click="copy"
      >
        <CheckIcon v-if="state === 'copied'" class="text-brand-ink" />
        <CopyIcon v-else />
        <span>{{ state === 'copied' ? t('copied') : t('copy') }}</span>
      </button>
      <span v-if="state === 'failed'" class="text-[11px] text-warn">
        {{ t('copyFailed') }}
      </span>
      <span class="sr-only" aria-live="polite">
        {{ state === 'copied' ? t('copied') : state === 'failed' ? t('copyFailed') : '' }}
      </span>
    </div>
    <p v-else class="text-ink-muted">{{ t('checksumUnavailable') }}</p>
  </div>
</template>
