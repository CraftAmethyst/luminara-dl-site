<script setup lang="ts">
import { PROXIES, isProxyId } from '@/lib/downloads'
import { selectedProxy, setProxy } from '@/lib/proxy-store'
import { useI18n } from '@/i18n'

const { t } = useI18n()

function onChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (isProxyId(value)) setProxy(value)
}
</script>

<template>
  <label class="inline-flex items-center gap-2 text-[13px] text-ink-muted">
    <span>{{ t('proxyLabel') }}</span>
    <select class="proxy-select" :value="selectedProxy" @change="onChange">
      <option v-for="proxy in PROXIES" :key="proxy.id" :value="proxy.id">
        {{ proxy.label }}
      </option>
    </select>
  </label>
</template>
