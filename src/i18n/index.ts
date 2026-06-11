import { createI18n } from 'vue-i18n'
import fr from './fr'
import en from './en'
import eu from './eu'
import es from './es'

export const SUPPORTED_LOCALES = ['fr', 'en', 'es', 'eu'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'bpi:locale'

function detectLocale(): AppLocale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && (SUPPORTED_LOCALES as readonly string[]).includes(saved)) return saved as AppLocale
  } catch {
    /* stockage indisponible */
  }
  const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase()
  return (SUPPORTED_LOCALES as readonly string[]).includes(nav) ? (nav as AppLocale) : 'fr'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'fr',
  messages: { fr, en, es, eu },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('lang', locale)
}
