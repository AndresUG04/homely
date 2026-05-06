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

import esWorkerJob from "./locales/es/workerJob.json";
import enWorkerJob from "./locales/en/workerJob.json";
import frWorkerJob from "./locales/fr/workerJob.json";

import esDashboardHeader from "./locales/es/dashboardHeader.json";
import enDashboardHeader from "./locales/en/dashboardHeader.json";
import frDashboardHeader from "./locales/fr/dashboardHeader.json";

import esDashboardHome from "./locales/es/dashboardHome.json";
import enDashboardHome from "./locales/en/dashboardHome.json";
import frDashboardHome from "./locales/fr/dashboardHome.json";

import esDashboardLayout from "./locales/es/dashboardLayout.json";
import enDashboardLayout from "./locales/en/dashboardLayout.json";
import frDashboardLayout from "./locales/fr/dashboardLayout.json";

import esSidebar from "./locales/es/sidebar.json";
import enSidebar from "./locales/en/sidebar.json";
import frSidebar from "./locales/fr/sidebar.json";

import esEditProfile from "./locales/es/editProfile.json";
import enEditProfile from "./locales/en/editProfile.json";
import frEditProfile from "./locales/fr/editProfile.json";

import esWorkHistory from "./locales/es/workHistory.json";
import enWorkHistory from "./locales/en/workHistory.json";
import frWorkHistory from "./locales/fr/workHistory.json";

import esSearchWorkers from "./locales/es/searchWorkers.json";
import enSearchWorkers from "./locales/en/searchWorkers.json";
import frSearchWorkers from "./locales/fr/searchWorkers.json";

import esWorkerPortable from "./locales/es/workerPortable.json";
import enWorkerPortable from "./locales/en/workerPortable.json";
import frWorkerPortable from "./locales/fr/workerPortable.json";

import esFindJobs from "./locales/es/findJobs.json";
import enFindJobs from "./locales/en/findJobs.json";
import frFindJobs from "./locales/fr/findJobs.json";

import esContracts from "./locales/es/contracts.json";
import enContracts from "./locales/en/contracts.json";
import frContracts from "./locales/fr/contracts.json";

import esContractList from "./locales/es/ContractList.json";
import enContractList from "./locales/en/ContractList.json";
import frContractList from "./locales/fr/ContractList.json";

import esAttendanceDetails from "./locales/es/AttendanceDetails.json";
import enAttendanceDetails from "./locales/en/AttendanceDetails.json";
import frAttendanceDetails from "./locales/fr/AttendanceDetails.json";

import esEmployerAttendance from "./locales/es/EmployerAttendance.json";
import enEmployerAttendance from "./locales/en/EmployerAttendance.json";
import frEmployerAttendance from "./locales/fr/EmployerAttendance.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "es",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    resources: {
      es: { translation: { ...esNav, ...esFooter, ...esFeatures, ...esCTASection, ...esHero, ...esHow, ...esProfile, ...esPricing, ...esTestimonials, ...esStats, ...esDashboard, ...esLogin, ...esRegister, ...esWorkerJob, ...esDashboardHeader, ...esDashboardHome, ...esDashboardLayout, ...esSidebar, ...esEditProfile, ...esWorkHistory, ...esSearchWorkers, ...esWorkerPortable, ...esFindJobs, ...esContracts } },
      en: { translation: { ...enNav, ...enFooter, ...enFeatures, ...enCTASection, ...enHero, ...enHow, ...enProfile, ...enPricing, ...enTestimonials, ...enStats, ...enDashboard, ...enLogin, ...enRegister, ...enWorkerJob, ...enDashboardHeader, ...enDashboardHome, ...enDashboardLayout, ...enSidebar, ...enEditProfile, ...enWorkHistory, ...enSearchWorkers, ...enWorkerPortable, ...enFindJobs, ...enContracts } },
      fr: { translation: { ...frNav, ...frFooter, ...frFeatures, ...frCTASection, ...frHero, ...frHow, ...frProfile, ...frPricing, ...frTestimonials, ...frStats, ...frDashboard, ...frLogin, ...frRegister, ...frWorkerJob, ...frDashboardHeader, ...frDashboardHome, ...frDashboardLayout, ...frSidebar, ...frEditProfile, ...frWorkHistory, ...frSearchWorkers, ...frWorkerPortable, ...frFindJobs, ...frContracts } },
      es: {
        translation: {
          ...esNav, ...esFooter, ...esFeatures, ...esCTASection,
          ...esHero, ...esHow, ...esProfile, ...esPricing,
          ...esTestimonials, ...esStats, ...esDashboard, ...esLogin,
          ...esRegister, ...esWorkerJob, ...esDashboardHeader,
          ...esDashboardHome, ...esDashboardLayout, ...esSidebar,
          ...esEditProfile, ...esWorkHistory, ...esSearchWorkers,
          ...esWorkerPortable, ...esFindJobs, ...esContractList,
          ...esAttendanceDetails, ...esEmployerAttendance,
        },
      },
      en: {
        translation: {
          ...enNav, ...enFooter, ...enFeatures, ...enCTASection,
          ...enHero, ...enHow, ...enProfile, ...enPricing,
          ...enTestimonials, ...enStats, ...enDashboard, ...enLogin,
          ...enRegister, ...enWorkerJob, ...enDashboardHeader,
          ...enDashboardHome, ...enDashboardLayout, ...enSidebar,
          ...enEditProfile, ...enWorkHistory, ...enSearchWorkers,
          ...enWorkerPortable, ...enFindJobs, ...enContractList,
          ...enAttendanceDetails, ...enEmployerAttendance,
        },
      },
      fr: {
        translation: {
          ...frNav, ...frFooter, ...frFeatures, ...frCTASection,
          ...frHero, ...frHow, ...frProfile, ...frPricing,
          ...frTestimonials, ...frStats, ...frDashboard, ...frLogin,
          ...frRegister, ...frWorkerJob, ...frDashboardHeader,
          ...frDashboardHome, ...frDashboardLayout, ...frSidebar,
          ...frEditProfile, ...frWorkHistory, ...frSearchWorkers,
          ...frWorkerPortable, ...frFindJobs, ...frContractList,
          ...frAttendanceDetails, ...frEmployerAttendance,
        },
      },
    },
  });

export default i18n;