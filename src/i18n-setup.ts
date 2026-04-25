import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Load translation files using http (default public/locales)
  // This enables lazy loading of translation files per language to keep the bundle small
  .use(Backend)
  // Detect user language from browser, localStorage, or URL
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: 'en', // Fallback language if a translation key is missing
    debug: true,       // Helpful for debugging during development
    
    // Support namespaces to organize translations by feature
    ns: ['common', 'auth', 'dashboard'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes values to prevent XSS
    },
    
    backend: {
      // Path where the translation files are stored
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'], // Cache the detected language in localStorage
    }
  });

// Automatically handle RTL support for Arabic
i18n.on('languageChanged', (lng) => {
  if (lng === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.lang = 'ar';
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.lang = lng;
  }
});

export default i18n;
