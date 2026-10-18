<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from '@/i18n'
import { copyText } from '@/lib/clipboard'
import { formatTimestamp } from '@/lib/format'
import CopyIcon from './icons/CopyIcon.vue'

const props = defineProps<{ generatedAt: string }>()
const { t, locale } = useI18n()

const qq = '929252864'
const copied = ref(false)
const year = new Date().getFullYear()
let timer: ReturnType<typeof setTimeout> | undefined

const docsUrl =
  locale === 'zh'
    ? 'https://lum.rimecraft.top/'
    : 'https://lum.rimecraft.top/en/'

async function copyQq() {
  const ok = await copyText(qq)
  copied.value = ok
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    copied.value = false
  }, 2200)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<template>
  <footer class="border-t border-line">
    <div
      class="container-page flex flex-col gap-3 py-5 text-[12px] text-ink-muted sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
        <a
          :href="docsUrl"
          class="transition-colors hover:text-ink"
          rel="noopener noreferrer"
        >{{ t('footerDocs') }}</a>
        <a
          href="https://github.com/CraftAmethyst/Luminara"
          class="transition-colors hover:text-ink"
          rel="noopener noreferrer"
        >{{ t('navGithub') }}</a>
        <a
          href="https://discord.gg/xn8KGphcvS"
          class="transition-colors hover:text-ink"
          rel="noopener noreferrer"
        >{{ t('footerDiscord') }}</a>
        <button
          type="button"
          class="inline-flex items-center gap-1 text-left transition-colors hover:text-ink"
          :aria-label="t('footerCopyQq')"
          @click="copyQq"
        >
          {{ t('footerQq') }} {{ qq }}
          <span v-if="copied" class="text-ink"> · {{ t('copied') }}</span>
          <CopyIcon v-else />
        </button>
      </div>
      <p>{{ t('footerData') }} {{ formatTimestamp(props.generatedAt, locale) }}</p>
    </div>

    <div
      class="container-page flex flex-col gap-1 border-t border-line py-4 text-[11px] text-ink-muted sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <a
          href="https://github.com/CraftAmethyst/Luminara/blob/stable/Trials/LICENSE"
          class="transition-colors hover:text-ink"
          rel="noopener noreferrer"
        >{{ t('footerSource') }}</a>
        <span class="mx-2" aria-hidden="true">·</span>
        © {{ year }} Luminara
      </p>
      <p>{{ t('proxyDisclaimer') }}</p>
    </div>

    <span class="sr-only" aria-live="polite">
      {{ copied ? t('copied') : '' }}
    </span>
  </footer>
</template>
