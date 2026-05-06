import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardHome from "./DashboardHome";
import EditProfile from "./EditProfile";
import SearchWorkers from "./SearchWorkers";
import AttendanceDetail from "../../pages/attendance/AttendanceDetail";
import ContractList from "../../pages/attendance/ContractList";
import EmployerAttendanceDetail from "../../pages/attendance/EmployerAttendanceDetail";
import EmployerContractList from "../../pages/attendance/EmployerContractList";
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
        return <AttendanceSection />;
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

function AttendanceSection() {
  const { token, user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const isEmployer = user?.role === "employer";

  useEffect(() => {
    const fetchContracts = async () => {
      const data = await api.get("/api/contracts", token);
      if (!data.error) setContracts(data);
      setLoading(false);
    };
    fetchContracts();
  }, [token]);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="w-8 h-8 border-4 border-[#D06224] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const activeContracts = contracts.filter(c => c.status === "Activo");

  // — EMPLEADOR —
  if (isEmployer) {
    if (selectedContract) {
      return (
        <EmployerAttendanceDetail
          contract={selectedContract}
          workerName={selectedContract.employee?.full_name || `Trabajadora #${selectedContract.employee_user_id?.slice(0, 8)}`}
          onBack={() => setSelectedContract(null)}
        />
      );
    }
    return <EmployerContractList contracts={activeContracts} onSelect={setSelectedContract} />;
  }

  // — EMPLEADA —
  if (activeContracts.length === 1 && !selectedContract) {
    return <AttendanceDetail contract={activeContracts[0]} onBack={() => setSelectedContract(null)} />;
  }

  if (selectedContract) {
    return <AttendanceDetail contract={selectedContract} onBack={() => setSelectedContract(null)} />;
  }

  return <ContractList contracts={activeContracts} onSelect={setSelectedContract} />;
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