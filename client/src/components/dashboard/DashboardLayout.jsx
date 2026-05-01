import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardHome from "./DashboardHome";
import EditProfile from "./EditProfile";
import SearchWorkers from "./SearchWorkers";
import Attendance from "../../pages/attendance/Attendance";
import { useTranslation } from "react-i18next";


export default function DashboardLayout() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("inicio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const renderSection = () => {
    switch (activeSection) {
      case "inicio":
        return <DashboardHome onNavigate={setActiveSection} />;
      case "perfil":
        return <EditProfile />;
      case "buscar":
        return <SearchWorkers />;
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
