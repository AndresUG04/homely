import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { useTranslation } from "react-i18next";
import { Briefcase, Clock, AlertCircle, CheckCircle, XCircle, Calendar } from "lucide-react";

const statusConfig = {
  Pendiente: {
    label: "my_applications.status_pending",
    icon: Clock,
    color: "#D06224",
    bg: "#D0622415",
  },
  Aceptado: {
    label: "my_applications.status_accepted",
    icon: CheckCircle,
    color: "#22c55e",
    bg: "#22c55e15",
  },
  Rechazado: {
    label: "my_applications.status_rejected",
    icon: XCircle,
    color: "#ef4444",
    bg: "#ef444415",
  },
};

function ApplicationCard({ application }) {
  const { t } = useTranslation();
  const job = application.job_offer;
  const config = statusConfig[application.status] || statusConfig.Pendiente;
  const StatusIcon = config.icon;

  const date = new Date(application.created_at).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="bg-white rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
      style={{ boxShadow: "0 2px 16px rgba(44,26,14,0.06)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#2C1A0E] truncate">{job?.title || "—"}</h3>
          <p className="text-sm text-[#5C3A1E]/70 mt-1 line-clamp-2">{job?.description || ""}</p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {t(config.label)}
        </div>
      </div>

      {job?.salary && (
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/60 mb-2">
          <span className="text-sm font-semibold" style={{ color: "#D06224" }}>
            ₡{job.salary.toLocaleString("es-CR")}
          </span>
          <span className="text-xs text-[#5C3A1E]/50">/hora</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[#5C3A1E]/50 mt-3 pt-3 border-t border-[#D06224]/10">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-xs">{t("my_applications.applied_on")} {date}</span>
      </div>
    </div>
  );
}

export default function MyApplications() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    const { applications: data, error } = await api.get("/api/job-applications/my", token);
    if (error) setError(error);
    else setApplications(data || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {t("my_applications.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("my_applications.subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("my_applications.loading")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{error}</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{t("my_applications.no_applications")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}
