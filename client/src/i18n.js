import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    resources: {
      es: {
        translation: {
          bienvenido: "Bienvenido",
        },
      },
      en: {
        translation: {
          bienvenido: "Welcome",
        },
      },
      fr: {
        translation: {
          bienvenido: "Bienvenue",
        },
      },
    },
  });

export default i18n;