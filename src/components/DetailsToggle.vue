<script setup lang="ts">
import { useI18n } from '@/i18n'
import ChevronDownIcon from './icons/ChevronDownIcon.vue'

defineProps<{ expanded: boolean; controls: string }>()
const emit = defineEmits<{ toggle: [] }>()
const { t } = useI18n()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-ink"
    :aria-expanded="expanded"
    :aria-controls="controls"
    @click="emit('toggle')"
  >
    {{ t('details') }}
    <ChevronDownIcon
      class="transition-transform"
      :class="{ 'rotate-180': expanded }"
    />
  </button>
</template>
