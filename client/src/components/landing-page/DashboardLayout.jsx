import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";
import DashboardHome from "./DashboardHome";
import EditProfile from "../../pages/profile/EditProfile";
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
import AttachContract from "../../pages/jobs/AttachContract";
import SignContract from "../../pages/jobs/SignContract";
import EmployerReviewContract from "../../pages/jobs/EmployerReviewContract";
import MyContracts from "../../pages/jobs/MyContracts";
import Payments from "../../pages/payments/Payments";
import ContractPaymentDetail from "./../../pages/payments/ContractPaymentDetail";
import Benefits from "./../../pages/benefits/Benefits";

export default function DashboardLayout({ initialSection = "inicio", initialJobId = null, initialApplicationId = null, initialContractId = null }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("activeDashboardSection") : null;
    return saved || initialSection;
  });
   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
   const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

   useEffect(() => {
    if (initialSection && initialSection !== activeSection) {
       setActiveSection(initialSection);
       localStorage.setItem("activeDashboardSection", initialSection);
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [initialSection]);

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    localStorage.setItem("activeDashboardSection", sectionId);

     const sectionRoutes = {
       "inicio": "/dashboard",
       "mis_ofertas": "/jobs/mine",
       "mis_contratos": "/contracts",
       "buscar_empleo": "/jobs",
       "crear_oferta": "/jobs/create",
       "asistencia": "/dashboard/attendance",
       "perfil": "/dashboard/profile",
       "buscar_trabajadoras": "/dashboard/search-workers",
       "buscar": "/dashboard/search-workers",
       "pagos": "/dashboard/payments",
       "beneficios": "/dashboard/benefits",
       "reportes": "/dashboard/reports",
     };
     // Las siguientes secciones solo cambian estado local, no tienen URL propia
     const localSections = ["ver_aplicaciones", "adjuntar_contrato", "mis_postulaciones"];

    const url = sectionRoutes[sectionId];
    if (url) {
      navigate(url, { replace: true });
     } else if (localSections.includes(sectionId)) {
        if (sectionId === "ver_aplicaciones" && !initialJobId) {
          navigate("/dashboard", { replace: true });
         setActiveSection("inicio");
         localStorage.setItem("activeDashboardSection", "inicio");
       }
    } else if (!localSections.includes(sectionId)) {
      navigate("/dashboard", { replace: true });
    }
  };

   const renderSection = () => {
     switch (activeSection) {
       case "inicio":
         return <DashboardHome onNavigate={handleSectionChange} />;
      case "buscar_empleo":
        return <FindJobs />;
      case "mis_postulaciones":
        return <MyApplications />;
      case "ver_aplicaciones":
        return <JobApplicants jobId={initialJobId} />;
      case "adjuntar_contrato":
        return <AttachContract jobId={initialJobId} applicationId={initialApplicationId} />;
      case "firmar_contrato":
        return <SignContract contractId={initialContractId} />;
      case "revisar_contrato":
        return <EmployerReviewContract contractId={initialContractId} />;
      case "mis_contratos":
        return <MyContracts />;
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
      case "pagos":
        return <Payments/>;
      case "pagos_detalle":
        return <ContractPaymentDetail contractId={initialContractId}/>;
      case "beneficios":
        return <Benefits contractId={initialContractId}/>;
      default:
        return <ComingSoon />;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#FBF5E0" }}>
      <Sidebar
        role={profile?.role}
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
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

  const activeContracts = contracts.filter(c => c.status === "accepted");

  if (isEmployer) {
    if (selectedContract) {
      return (
        <EmployerAttendanceDetail
          contract={selectedContract}
          workerName={selectedContract.employee_user?.full_name || `Trabajadora #${selectedContract.employee_user_id?.slice(0, 8)}`}
          onBack={() => setSelectedContract(null)}
        />
      );
    }
    return <EmployerContractList contracts={activeContracts} onSelect={setSelectedContract} />;
  }

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