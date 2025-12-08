import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'

const savedLanguage = localStorage.getItem('language') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

// Update HTML direction when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lng)
  localStorage.setItem('language', lng)
})

// Set initial direction
document.documentElement.setAttribute('dir', savedLanguage === 'ar' ? 'rtl' : 'ltr')
document.documentElement.setAttribute('lang', savedLanguage)

export default i18n
