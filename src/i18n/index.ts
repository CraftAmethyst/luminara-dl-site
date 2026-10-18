import {
  inject,
  provide,
  type InjectionKey,
} from 'vue'
import { zh } from './messages.zh'
import { en } from './messages.en'
import type { Locale, MessageKey, Messages } from './types'

export interface I18nContext {
  locale: Locale
  messages: Messages
  t: (
    key: MessageKey,
    params?: Record<string, string | number>,
  ) => string
}

const dictionaries: Record<Locale, Messages> = { zh, en }
const I18N_KEY: InjectionKey<I18nContext> = Symbol('luminara-i18n')

export function createI18n(locale: Locale): I18nContext {
  const messages = dictionaries[locale]
  const t = (
    key: MessageKey,
    params?: Record<string, string | number>,
  ): string => {
    let value = messages[key] ?? zh[key] ?? key
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replaceAll(`{${name}}`, String(replacement))
      }
    }
    return value
  }
  return { locale, messages, t }
}

export function provideI18n(locale: Locale): I18nContext {
  const context = createI18n(locale)
  provide(I18N_KEY, context)
  return context
}

export function useI18n(): I18nContext {
  return inject(I18N_KEY, null) ?? createI18n('zh')
}
