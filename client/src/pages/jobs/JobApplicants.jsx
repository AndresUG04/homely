import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  AlertCircle, ArrowLeft, CheckCircle, XCircle, Clock,
  Mail, Phone, User, X,
} from "lucide-react";

const statusConfig = {
  Pendiente: {
    label: "applicants.status_pending",
    icon: Clock,
    color: "#D06224",
    bg: "#D0622415",
    border: "#D0622430",
  },
  Aceptado: {
    label: "applicants.status_accepted",
    icon: CheckCircle,
    color: "#22c55e",
    bg: "#22c55e15",
    border: "#22c55e30",
  },
  Rechazado: {
    label: "applicants.status_rejected",
    icon: XCircle,
    color: "#ef4444",
    bg: "#ef444415",
    border: "#ef444430",
  },
};

function ApplicantCard({ application, onAccept, onReject, hasAcceptedApplicant, actionLoading }) {
  const { t } = useTranslation();
  const applicant = application.employee?.user || {};
  const config = statusConfig[application.status] || statusConfig.Pendiente;
  const StatusIcon = config.icon;
  const isPending = application.status === "Pendiente";
  const isActionLoading = actionLoading === application.id;
  const isDisabled = !isPending || hasAcceptedApplicant || isActionLoading;

  return (
    <div
      className="bg-white rounded-2xl p-6 transition-all duration-200"
      style={{ boxShadow: "0 2px 16px rgba(44,26,14,0.06)", opacity: hasAcceptedApplicant && !isPending ? 0.6 : 1 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: "#D06224" }}
            >
              {(applicant.full_name || "?")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#2C1A0E] truncate">{applicant.full_name || "—"}</h3>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {applicant.email && (
              <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/70">
                <Mail className="w-4 h-4 text-[#D06224]/60" />
                <span className="truncate">{applicant.email}</span>
              </div>
            )}
            {applicant.phone && (
              <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/70">
                <Phone className="w-4 h-4 text-[#D06224]/60" />
                <span>{applicant.phone}</span>
              </div>
            )}
          </div>

          <div className="mt-3 text-xs text-[#5C3A1E]/50">
            {t("applicants.applied_on")} {new Date(application.created_at).toLocaleDateString("es-CR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {t(config.label)}
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#D06224]/10">
          <button
            onClick={() => onAccept(application)}
            disabled={isDisabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {t("applicants.accept")}
          </button>
          <button
            onClick={() => onReject(application.id)}
            disabled={isDisabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            {t("applicants.reject")}
          </button>
          {hasAcceptedApplicant && (
            <p className="ml-auto text-xs text-[#5C3A1E]/50">{t("applicants.already_accepted")}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobApplicants({ jobId: propJobId }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const params = useParams();
  const navigate = useNavigate();
  const jobId = propJobId || params.id;

  const [applications, setApplications] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    const { applications: data, error } = await api.get(`/api/job-applications/job/${jobId}`, token);
    if (error) setError(error);
    else {
      setApplications(data || []);
      if (data?.[0]?.job_offer?.title) {
        setJobTitle(data[0].job_offer.title);
      }
    }
    setLoading(false);
  }, [jobId, token]);

  useEffect(() => {
    if (jobId) loadApplications();
  }, [jobId, loadApplications]);

  const handleStatusChange = async (applicationId, newStatus, { reload = true } = {}) => {
    setActionLoading(applicationId);
    const { error } = await api.put(`/api/job-applications/${applicationId}`, { status: newStatus }, token);
    setActionLoading(null);
    if (error) {
      toast.error(error);
      return false;
    }

    if (reload) {
      await loadApplications();
    }
    return true;
  };

  const handleAcceptAction = async (application, redirectToContract = false) => {
    const success = await handleStatusChange(application.id, "Aceptado", { reload: !redirectToContract });
    if (!success) return;

    if (redirectToContract) {
      navigate(`/jobs/${jobId}/contracts/${application.id}`, { state: { application } });
      return;
    }

    closeContractModal();
    toast.success("Aplicante aceptado. Podés enviar el contrato luego desde Mis contratos.");
    navigate("/contracts", { replace: true });
  };

  const openContractModal = (application) => {
    setSelectedApplication(application);
    setShowContractModal(true);
  };

  const closeContractModal = () => {
    setShowContractModal(false);
    setSelectedApplication(null);
  };

  const isModalLoading = selectedApplication ? actionLoading === selectedApplication.id : false;

  const hasAcceptedApplicant = applications.some((a) => a.status === "Aceptado");

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate("/jobs/mine")}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("applicants.back_to_offers")}
        </button>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {jobTitle || t("applicants.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("applicants.subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("applicants.loading")}</p>
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
            <User className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{t("applicants.no_applicants")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hasAcceptedApplicant && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-700 font-medium">{t("applicants.accepted_warning")}</p>
            </div>
          )}
          {applications.map((app) => (
            <ApplicantCard
              key={app.id}
              application={app}
              onAccept={(application) => openContractModal(application)}
              onReject={(id) => handleStatusChange(id, "Rechazado")}
              hasAcceptedApplicant={hasAcceptedApplicant}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Contract Modal */}
      {showContractModal && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeContractModal} />
          <div className="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#D06224]/10">
              <h2 className="text-xl font-bold text-[#2C1A0E]">
                {t("applicants.send_contract_title") || "¿Querés enviarle el contrato ahora?"}
              </h2>
              <button
                onClick={closeContractModal}
                className="text-[#5C3A1E]/60 hover:text-[#5C3A1E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-[#5C3A1E]/70 mb-6">
                {t("applicants.send_contract_desc") || "Podés enviarle el contrato ahora o hacerlo después. El aplicante quedará en estado aceptado en cualquier caso."}
              </p>

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => handleAcceptAction(selectedApplication, false)}
                  disabled={isModalLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#5C3A1E] hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("applicants.send_later") || "Hacerlo después"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptAction(selectedApplication, true)}
                  disabled={isModalLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("applicants.send_now") || "Enviar contrato"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
