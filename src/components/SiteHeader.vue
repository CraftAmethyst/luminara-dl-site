<script setup lang="ts">
import { computed } from 'vue'
import logoUrl from '@/assets/brand/logo-64.png'
import type { BranchId } from '@/types/releases'
import type { Locale } from '@/i18n/types'
import { useI18n } from '@/i18n'
import GithubIcon from './icons/GithubIcon.vue'

const props = defineProps<{ locale: Locale; branch: BranchId }>()
const { t } = useI18n()

const isZh = props.locale === 'zh'
const homePath = isZh ? '/' : '/en/'
const otherPath = computed(
  () =>
    `${isZh ? '/en/' : '/'}${
      props.branch === 'feudalkings' ? '?branch=feudalkings' : ''
    }`,
)
const docsUrl = isZh
  ? 'https://lum.rimecraft.top/'
  : 'https://lum.rimecraft.top/en/'
const githubUrl = 'https://github.com/CraftAmethyst/Luminara'
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-line bg-paper">
    <div class="container-page flex h-14 items-center justify-between gap-3">
      <a :href="homePath" class="flex min-w-0 items-center gap-2.5">
        <img
          :src="logoUrl"
          alt=""
          width="24"
          height="24"
          class="h-6 w-6 shrink-0 rounded-[6px]"
        />
        <span class="text-[15px] font-semibold tracking-tight">Luminara</span>
      </a>

      <div class="flex items-center gap-4">
        <nav
          class="flex items-center gap-4 text-[13px] font-medium text-ink-muted sm:gap-5"
        >
          <a
            :href="docsUrl"
            class="transition-colors hover:text-ink"
            rel="noopener noreferrer"
          >{{ t('navDocs') }}</a>
          <a
            :href="githubUrl"
            class="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            rel="noopener noreferrer"
          >
            <GithubIcon />
            <span class="hidden sm:inline">{{ t('navGithub') }}</span>
          </a>
        </nav>

        <span class="h-4 w-px bg-line" aria-hidden="true"></span>

        <div class="flex items-center gap-1.5 text-[13px]">
          <template v-if="isZh">
            <span class="font-semibold text-ink" aria-current="page">
              {{ t('languageZh') }}
            </span>
            <span class="text-line-strong" aria-hidden="true">/</span>
            <a
              :href="otherPath"
              hreflang="en"
              lang="en"
              class="text-ink-muted transition-colors hover:text-ink"
            >{{ t('languageEn') }}</a>
          </template>
          <template v-else>
            <a
              :href="otherPath"
              hreflang="zh-CN"
              lang="zh-CN"
              class="text-ink-muted transition-colors hover:text-ink"
            >{{ t('languageZh') }}</a>
            <span class="text-line-strong" aria-hidden="true">/</span>
            <span class="font-semibold text-ink" aria-current="page">
              {{ t('languageEn') }}
            </span>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>
