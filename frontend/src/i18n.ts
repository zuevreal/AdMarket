/**
 * i18n configuration for AdMarket frontend.
 * Detects language from Telegram WebApp with fallback to English.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import ru from './locales/ru.json'

// Custom language detector for Telegram WebApp
const telegramLanguageDetector = {
    name: 'telegramWebApp',
    lookup: (): string | undefined => {
        try {
            // Priority: Telegram WebApp user language
            const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
            if (tgLang) {
                // Support 'ru' and 'ru-RU' formats
                return tgLang.startsWith('ru') ? 'ru' : 'en'
            }
        } catch {
            // Fallback if Telegram WebApp not available
        }
        return undefined
    },
    cacheUserLanguage: (): void => {
        // We don't cache Telegram language - always read fresh
    },
}

// Create language detector instance
const languageDetector = new LanguageDetector()
languageDetector.addDetector(telegramLanguageDetector)

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ru: { translation: ru },
        },
        fallbackLng: 'en',
        supportedLngs: ['en', 'ru'],

        // Detection order: Telegram first, then browser
        detection: {
            order: ['telegramWebApp', 'navigator', 'htmlTag'],
            caches: [], // Don't cache - always detect fresh
        },

        interpolation: {
            escapeValue: false, // React already escapes
        },

        react: {
            useSuspense: false, // Avoid suspense issues in Telegram WebApp
        },
    })

export default i18n

// Extend Window interface for Telegram WebApp
declare global {
    interface Window {
        Telegram?: {
            WebApp?: {
                initDataUnsafe?: {
                    user?: {
                        language_code?: string
                    }
                }
            }
        }
    }
}
