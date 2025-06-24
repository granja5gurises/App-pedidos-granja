import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)

  // 🌐 Detecta idioma del navegador, pero si el usuario cambia se guarda en localStorage.
  // Si no se detecta o no está disponible, cae a español (es).

  .init({
    fallbackLng: 'es',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'] // ✅ Guarda la elección del usuario
    },
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}.json?v=1', // 👈 Evita cache viejo
    },
    cache: {
      enabled: false,
    }
  });

export default i18n;
