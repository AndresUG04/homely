import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import esNav from "./locales/es/navbar.json";
import esFooter from "./locales/es/footer.json";
import esFeatures from "./locales/es/features.json";
import esCTASection from "./locales/es/CTASection.json";


import enNav from "./locales/en/navbar.json";
import enFooter from "./locales/en/footer.json";
import enFeatures from "./locales/en/features.json";
import enCTASection from "./locales/en/CTASection.json";

import frNav from "./locales/fr/navbar.json";
import frFooter from "./locales/fr/footer.json";
import frFeatures from "./locales/fr/features.json";
import frCTASection from "./locales/fr/CTASection.json";
import esHero from "./locales/es/hero.json";
import enHero from "./locales/en/hero.json";
import frHero from "./locales/fr/hero.json";
import esHow from "./locales/es/how.json";
import enHow from "./locales/en/how.json";
import frHow from "./locales/fr/how.json";
import esProfile from "./locales/es/profile.json";
import enProfile from "./locales/en/profile.json";
import frProfile from "./locales/fr/profile.json";

import esPricing from "./locales/es/pricing.json";
import enPricing from "./locales/en/pricing.json";
import frPricing from "./locales/fr/pricing.json";
import esTestimonials from "./locales/es/testimonials.json";
import enTestimonials from "./locales/en/testimonials.json";
import frTestimonials from "./locales/fr/testimonials.json";

import esStats from "./locales/es/stats.json";
import enStats from "./locales/en/stats.json";
import frStats from "./locales/fr/stats.json";

import esDashboard from "./locales/es/dashboard.json";
import enDashboard from "./locales/en/dashboard.json";
import frDashboard from "./locales/fr/dashboard.json";

import esLogin from "./locales/es/login.json";
import enLogin from "./locales/en/login.json";
import frLogin from "./locales/fr/login.json";

import esRegister from "./locales/es/register.json";
import enRegister from "./locales/en/register.json";
import frRegister from "./locales/fr/register.json";
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    resources: {
      es: { translation: { ...esNav, ...esFooter, ...esFeatures, ...esCTASection, ...esHero, ...esHow, ...esProfile, ...esPricing, ...esTestimonials, ...esStats, ...esDashboard, ...esLogin, ...esRegister } },
      en: { translation: { ...enNav, ...enFooter, ...enFeatures, ...enCTASection, ...enHero, ...enHow, ...enProfile, ...enPricing, ...enTestimonials, ...enStats, ...enDashboard, ...enLogin, ...enRegister } },
      fr: { translation: { ...frNav, ...frFooter, ...frFeatures, ...frCTASection, ...frHero, ...frHow, ...frProfile, ...frPricing, ...frTestimonials, ...frStats, ...frDashboard, ...frLogin, ...frRegister } },
    },
  });

export default i18n;