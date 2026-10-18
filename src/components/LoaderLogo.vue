<script setup lang="ts">
import { computed } from 'vue'
import type { Loader } from '@/types/releases'
import forgeLogo from '@/assets/loaders/forge.svg'
import neoforgeLogo from '@/assets/loaders/neoforge.svg'
import fabricLogo from '@/assets/loaders/fabric.svg'

const props = defineProps<{ loader: Loader; invert?: boolean }>()

const LOGOS: Partial<Record<Loader, string>> = {
  forge: forgeLogo,
  neoforge: neoforgeLogo,
  fabric: fabricLogo,
}

const logo = computed(() => LOGOS[props.loader] ?? null)
const filter = computed(() =>
  props.invert && props.loader === 'forge'
    ? 'brightness(0) invert(1)'
    : undefined,
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center"
    aria-hidden="true"
  >
    <img
      v-if="logo"
      :src="logo"
      alt=""
      class="h-full w-full object-contain"
      :style="filter ? { filter } : undefined"
    />
    <svg
      v-else
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="#6B7280"
      stroke-width="1.8"
      stroke-linejoin="round"
      class="h-full w-full"
      :style="filter ? { filter } : undefined"
    >
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="m3 8 9 5 9-5M12 13v8" />
    </svg>
  </span>
</template>
