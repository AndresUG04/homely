import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import DashboardLayout from "../../components/dashboard/DashboardLayout";

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useTranslation();

  if (!profile)
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FBF5E0" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("sidebar.loading")}</p>
        </div>
      </div>
    );

  return <DashboardLayout />;
}