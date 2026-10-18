<script setup lang="ts">
import { useI18n } from '@/i18n'

const props = withDefaults(
  defineProps<{
    title?: string
    body?: string
    actionLabel?: string
    actionHref?: string
  }>(),
  {
    title: '',
    body: '',
    actionLabel: '',
    actionHref: 'https://github.com/CraftAmethyst/Luminara/releases',
  },
)

const { t } = useI18n()
</script>

<template>
  <div
    class="rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-10 text-center"
  >
    <p class="text-base font-semibold">{{ props.title || t('emptyTitle') }}</p>
    <p class="mt-2 text-sm text-ink-muted">{{ props.body || t('emptyBody') }}</p>
    <a
      class="btn btn-secondary mt-5"
      :href="props.actionHref"
      rel="noopener noreferrer"
    >
      {{ props.actionLabel || t('emptyAction') }}
    </a>
  </div>
</template>
