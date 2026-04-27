import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Clock,
  DollarSign,
  Gift,
  BarChart2,
  Search,
  Briefcase,
  User,
  LogOut,
} from "lucide-react";

const employerLinks = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "contratos", label: "Contratos", icon: FileText },
  { id: "asistencia", label: "Asistencia", icon: Clock },
  { id: "pagos", label: "Pagos", icon: DollarSign },
  { id: "beneficios", label: "Beneficios", icon: Gift },
  { id: "reportes", label: "Reportes", icon: BarChart2 },
  { id: "buscar_trabajadoras", label: "Buscar trabajadoras", icon: Search },
  { id: "perfil", label: "Mi perfil", icon: User },
];

const workerLinks = [
  { id: "inicio", label: "Inicio", icon: Home },
  { id: "portable_profile", label: "My Portable Profile", icon: User },
  { id: "buscar_empleo", label: "Buscar empleo", icon: Search },
  { id: "perfil", label: "Mi perfil portátil", icon: User },
  { id: "contratos", label: "Mis contratos", icon: FileText },
  { id: "asistencia", label: "Mi asistencia", icon: Clock },
  { id: "pagos", label: "Mis pagos", icon: DollarSign },
  { id: "beneficios", label: "Beneficios", icon: Gift }
];

const toggleBtnClass =
  "w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-150 cursor-pointer border-none bg-transparent";

export default function Sidebar({
  role,
  activeSection,
  setActiveSection,
  isSidebarOpen,
  toggleSidebar,
}) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const links = role === "employer" ? employerLinks : workerLinks;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full flex flex-col z-40 border-r transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-60 opacity-100" : "w-0 opacity-0 overflow-hidden"
      }`}
      style={{ backgroundColor: "#FFFFFF", borderColor: "#D0622215" }}
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "#D0622215" }}>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#D06224] flex items-center justify-center">
              <Home className="w-5 h-5 text-[#FBF5E0]" strokeWidth={2} />
            </div>
            <span
              className="text-2xl font-bold text-[#2C1A0E]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Homely
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className={toggleBtnClass}
            aria-label="Cerrar panel lateral"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>
        <div
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: role === "employer" ? "#D0622215" : "#8A863515",
            color: role === "employer" ? "#D06224" : "#8A8635",
          }}
        >
          <Briefcase className="w-3 h-3" />
          {role === "employer" ? "Empleador" : "Trabajadora"}
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: isActive ? "#D0622215" : "transparent",
                color: isActive ? "#D06224" : "#5C3A1E",
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D06224]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t" style={{ borderColor: "#D0622215" }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-[#AE431E]/10"
          style={{ color: "#AE431E" }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
