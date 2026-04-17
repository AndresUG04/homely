import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardHome from "./DashboardHome";
import EditProfile from "./EditProfile";

export default function DashboardLayout() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState("inicio");

  const renderSection = () => {
    switch (activeSection) {
      case "inicio":
        return <DashboardHome onNavigate={setActiveSection} />;
      case "perfil":
        return <EditProfile />;
      default:
        return <ComingSoon section={activeSection} />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#FBF5E0" }}>
      <Sidebar
        role={profile?.role}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="flex-1 flex flex-col ml-64">
        <DashboardHeader />
        <main className="flex-1 p-8">{renderSection()}</main>
      </div>
    </div>
  );
}

function ComingSoon({ section }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
        <span className="text-3xl">🚧</span>
      </div>
      <h2
        className="text-xl font-bold text-[#2C1A0E]"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Próximamente
      </h2>
      <p className="text-sm text-[#5C3A1E]/60">
        Esta sección está en construcción
      </p>
    </div>
  );
}
