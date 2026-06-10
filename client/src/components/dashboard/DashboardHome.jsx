import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import {
  FileText, Clock, DollarSign, Gift,
  ArrowRight, AlertCircle, Star, CheckCircle, X,
} from "lucide-react";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return "Justo ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks <= 2) return `Hace ${diffWeeks} semana${diffWeeks > 1 ? "s" : ""}`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Hace ${diffMonths} meses`;
}

const STATUS_META = {
  sent:             { icon: Clock,       color: "#8A8635", label: "statusPendingSign" },
  worker_signed:    { icon: CheckCircle, color: "#2F855A", label: "statusWorkerSigned" },
  accepted:         { icon: CheckCircle, color: "#2F855A", label: "active" },
  rejected:         { icon: X,           color: "#991B1B", label: "statusRejected" },
  finalized:        { icon: FileText,    color: "#2563EB", label: "statusFinalized" },
};

export default function DashboardHome({ onNavigate }) {
  const { profile, user, token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recentContracts, setRecentContracts] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRecent = async () => {
      const data = await api.get("/api/contracts", token);
      if (cancelled) return;
      if (!data.error) {
        const sorted = (data || [])
          .filter(c => c.status !== "draft")
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 5);
        setRecentContracts(sorted);
      }
      setLoadingActivity(false);
    };
    fetchRecent();
    return () => { cancelled = true; };
  }, [token]);
  const isWorker = profile?.role === "worker" || profile?.role === "employee";

  const stats = isWorker ? [
    { labelKey: "dashboardHome.stat_contracts", value: "0", icon: FileText, color: "#D06224", bg: "#D0622215" },
    { labelKey: "dashboardHome.stat_attendance_month", value: `0 ${t("dashboardHome.days_unit")}`, icon: Clock, color: "#8A8635", bg: "#8A863515" },
    { labelKey: "dashboardHome.stat_last_payment", value: "₡0", icon: DollarSign, color: "#AE431E", bg: "#AE431E15" },
    { labelKey: "dashboardHome.stat_benefits", value: "₡0", icon: Gift, color: "#6B6828", bg: "#6B682815" },
  ] : [
    { labelKey: "dashboardHome.stat_contracts", value: "0", icon: FileText, color: "#D06224", bg: "#D0622215" },
    { labelKey: "dashboardHome.stat_attendance_today", value: "—", icon: Clock, color: "#8A8635", bg: "#8A863515" },
    { labelKey: "dashboardHome.stat_last_payment", value: "₡0", icon: DollarSign, color: "#AE431E", bg: "#AE431E15" },
    { labelKey: "dashboardHome.stat_benefits", value: "₡0", icon: Gift, color: "#6B6828", bg: "#6B682815" },
  ];

  const quickActions = isWorker ? [
    { labelKey: "dashboardHome.action_confirm_attendance", icon: Clock, color: "#8A8635", nav: "asistencia" },
    { labelKey: "dashboardHome.action_my_payments", icon: DollarSign, color: "#D06224", nav: "pagos" },
    { labelKey: "dashboardHome.action_my_profile", icon: Star, color: "#AE431E", nav: "perfil" },
  ] : [
    { labelKey: "dashboardHome.action_register_payment", icon: DollarSign, color: "#D06224", nav: "pagos" },
    { labelKey: "dashboardHome.action_mark_attendance", icon: Clock, color: "#8A8635", nav: "asistencia" },
    { labelKey: "dashboardHome.action_new_contract", icon: FileText, color: "#AE431E", nav: "contratos" },
  ];

  const banner = isWorker ? {
    titleKey: "dashboardHome.worker_banner_title",
    subtitleKey: "dashboardHome.worker_banner_subtitle",
    ctaKey: "dashboardHome.worker_banner_cta",
    background: "linear-gradient(135deg, #8A8635 0%, #6B6828 100%)",
    shadow: "0 8px 24px rgba(138,134,53,0.25)",
  } : {
    titleKey: "dashboardHome.employer_banner_title",
    subtitleKey: "dashboardHome.employer_banner_subtitle",
    ctaKey: "dashboardHome.employer_banner_cta",
    background: "linear-gradient(135deg, #D06224 0%, #AE431E 100%)",
    shadow: "0 8px 24px rgba(208,98,36,0.25)",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t(isWorker ? "dashboardHome.worker_title" : "dashboardHome.employer_title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {t(isWorker ? "dashboardHome.worker_subtitle" : "dashboardHome.employer_subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ labelKey, value, icon: Icon, color, bg }) => (
          <div key={labelKey} className="bg-white rounded-2xl px-6 py-5 flex items-center gap-4"
            style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bg }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                {value}
              </p>
              <p className="text-xs text-[#5C3A1E]/60 mt-0.5">{t(labelKey)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
          <h2 className="text-base font-bold text-[#2C1A0E] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("dashboardHome.quick_actions")}
          </h2>
          <div className="space-y-3">
            {quickActions.map(({ labelKey, icon: Icon, color, nav }) => (
              <button key={labelKey}
                onClick={() => onNavigate?.(nav)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: `${color}10`, color }}>
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{t(labelKey)}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
          <h2 className="text-base font-bold text-[#2C1A0E] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("dashboardHome.recent_activity")}
          </h2>
          {loadingActivity ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-[#D06224] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentContracts.length > 0 ? (
            <div className="space-y-2">
              {recentContracts.map(c => {
                const meta = STATUS_META[c.status];
                const Icon = meta?.icon || FileText;
                const color = meta?.color || "#5C3A1E";
                return (
                  <button key={c.id}
                    onClick={() => {
                      if (isWorker) {
                        navigate(`/contracts/${c.id}/sign`);
                      } else {
                        navigate(`/contracts/${c.id}/review`);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FBF5E0] transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#2C1A0E] truncate">{c.title}</p>
                      <p className="text-xs text-[#5C3A1E]/50 mt-0.5">
                        {timeAgo(c.updated_at || c.created_at)}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-md flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}>
                      {t(`contracts.${meta?.label || "statusPendingSign"}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-[#D06224]/40" />
              </div>
              <p className="text-sm text-[#5C3A1E]/40 text-center">
                {t("dashboardHome.no_activity")}
                <br />
                {t(isWorker ? "dashboardHome.worker_empty" : "dashboardHome.employer_empty")}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{ background: banner.background, boxShadow: banner.shadow }}>
        <div>
          <p className="text-[#FBF5E0] font-bold text-base" style={{ fontFamily: "'Fraunces', serif" }}>
            {t(banner.titleKey)}
          </p>
          <p className="text-[#FBF5E0]/70 text-sm mt-0.5">{t(banner.subtitleKey)}</p>
        </div>
        <button onClick={() => onNavigate?.("perfil")}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-[#FBF5E0] text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 flex-shrink-0">
          {t(banner.ctaKey)} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}