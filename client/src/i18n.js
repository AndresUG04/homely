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
          nav_inicio: "Inicio",
          nav_funcionalidades: "Funcionalidades",
          nav_como_funciona: "¿Cómo funciona?",
          nav_planes: "Planes",
          nav_testimonios: "Testimonios",
          nav_login: "Iniciar sesión",
          nav_register: "Comenzar gratis",
        },
      },
      en: {
        translation: {
          nav_inicio: "Home",
          nav_funcionalidades: "Features",
          nav_como_funciona: "How it works?",
          nav_planes: "Plans",
          nav_testimonios: "Testimonials",
          nav_login: "Log in",
          nav_register: "Get started free",
        },
      },
      fr: {
        translation: {
          nav_inicio: "Accueil",
          nav_funcionalidades: "Fonctionnalités",
          nav_como_funciona: "Comment ça marche?",
          nav_planes: "Plans",
          nav_testimonios: "Témoignages",
          nav_login: "Se connecter",
          nav_register: "Commencer gratuitement",
        },
      },
    },
  });

export default i18n;