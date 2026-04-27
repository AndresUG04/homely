import { useAuth } from "../../context/AuthContext";
import { Bell, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const toggleBtnClass =
  "w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors duration-150 cursor-pointer border-none bg-transparent";

export default function DashboardHeader({ isSidebarOpen, toggleSidebar }) {
  const { profile } = useAuth();
  const { t, i18n } = useTranslation();
  const fullName = profile?.full_name || "";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.greeting_morning");
    if (hour < 18) return t("dashboard.greeting_afternoon");
    return t("dashboard.greeting_night");
  };

  const firstName = fullName?.split(" ")[0] || "";

  return (
    <header
      className="h-16 flex items-center justify-between px-8 border-b bg-white sticky top-0 z-30"
      style={{ borderColor: "#D0622215" }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`transition-all duration-200 ${
            isSidebarOpen ? "w-0 opacity-0 pointer-events-none overflow-hidden" : "w-7 opacity-100"
          }`}
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className={toggleBtnClass}
            aria-label="Abrir panel lateral"
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

        <div>
          <p className="text-base font-semibold text-[#2C1A0E]">
            {getGreeting()}, <span style={{ color: "#D06224" }}>{firstName}</span>{" "}
            👋
          </p>
          <p className="text-xs text-[#5C3A1E]/50">
            {new Date().toLocaleDateString(i18n.language, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Globe className="w-4 h-4" style={{ color: "#D06224" }} />
          <select
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            value={i18n.language}
            className="bg-transparent border-none outline-none cursor-pointer text-xs"
            style={{ color: "#51321a" }}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="fr">Français</option>
          </select>
        </div>

        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#D06224]/10 relative"
          style={{ color: "#b45100" }}
        >
          <Bell className="w-4 h-4" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D06224]" />
        </button>

        <div className="w-9 h-9 rounded-xl bg-[#D06224] flex items-center justify-center">
          <span className="text-sm font-bold text-[#FBF5E0]">
            {firstName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
