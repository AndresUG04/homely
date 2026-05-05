import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardHome from "./DashboardHome";
import EditProfile from "./EditProfile";
import SearchWorkers from "./SearchWorkers";
import Attendance from "../../pages/attendance/Attendance";
import { useTranslation } from "react-i18next";
import FindJobs from "../../pages/jobs/FindJobs";
import MyJobOffers from "../../pages/jobs/MyJobOffers";
import CreateJobOffer from "../../pages/jobs/CreateJobOffer";
import MyApplications from "../../pages/jobs/MyApplications";
import JobApplicants from "../../pages/jobs/JobApplicants";


export default function DashboardLayout({ initialSection = "inicio", initialJobId = null }) {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const renderSection = () => {
    switch (activeSection) {
      case "inicio":
        return <DashboardHome onNavigate={setActiveSection} />;
      case "buscar_empleo":
        return <FindJobs />;
      case "mis_postulaciones":
        return <MyApplications />;
      case "ver_aplicaciones":
        return <JobApplicants jobId={initialJobId} />;
      case "buscar_trabajadoras":
        return <SearchWorkers />;
      case "perfil":
        return <EditProfile />;
      case "buscar":
        return <SearchWorkers />;
      case "mis_ofertas":
        return <MyJobOffers />;
      case "crear_oferta":
        return <CreateJobOffer />;
      case "asistencia":
        return <Attendance />;
      default:
        return <ComingSoon />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#FBF5E0" }}>
      <Sidebar
        role={profile?.role}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-60" : "ml-0"
        }`}
      >
        <DashboardHeader isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 p-8">{renderSection()}</main>
      </div>
    </div>
  );
}

function ComingSoon() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
        <span className="text-3xl">🚧</span>
      </div>
      <h2
        className="text-xl font-bold text-[#2C1A0E]"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        {t("dashboardLayout.coming_soon")}
      </h2>
      <p className="text-sm text-[#5C3A1E]/60">
        {t("dashboardLayout.coming_soon_subtitle")}
      </p>
    </div>
  );
}
