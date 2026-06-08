import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import { toast } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  CircleCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  X,
} from "lucide-react";
import ContractTerminationPanel from "../../components/contracts/ContractTerminationPanel";

function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `₡${Number(value).toLocaleString("es-CR")}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ProcessStep({ active = false, done = false, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center pt-1">
        <div
          className="w-3.5 h-3.5 rounded-full border-2"
          style={{
            backgroundColor: done ? "#2F855A" : active ? "#D06224" : "#FBF5E0",
            borderColor: done ? "#2F855A" : active ? "#D06224" : "#E7D5B8",
          }}
        />
        <div className="w-px flex-1 min-h-7 bg-[#E7D5B8] mt-1" />
      </div>
      <div className="pb-4">
        <p
          className="text-sm font-semibold"
          style={{ color: done ? "#2F855A" : active ? "#D06224" : "#5C3A1E" }}
        >
          {title}
        </p>
        <p className="text-xs text-[#5C3A1E]/60 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export default function EmployerReviewContract() {
  const { t } = useTranslation();
  const { contractId: paramContractId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [workerDownloadUrl, setWorkerDownloadUrl] = useState("");
  const [employerDownloadUrl, setEmployerDownloadUrl] = useState("");

  useEffect(() => {
    const loadContract = async () => {
      setLoading(true);
      setError("");

      const {
        contract: fetchedContract,
        termination,
        terminationResponses,
        error: fetchError,
      } = await api.get(`/api/contracts/${paramContractId}`, token);

      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (!fetchedContract) {
        setError(t("contracts.contractNotFoundError"));
        setLoading(false);
        return;
      }

      setContract({
        ...fetchedContract,
        termination,
        terminationResponses: terminationResponses || [],
      });
      setLoading(false);
    };

    loadContract();
  }, [paramContractId, token]);

  useEffect(() => {
    const loadDownloadUrls = async () => {
      if (!token || !contract?.id) return;

      if (contract.employer_contract_url && !employerDownloadUrl) {
        const { downloadUrl: url } = await api.get(
          `/api/contracts/${contract.id}/download/employer`,
          token
        );
        if (url) {
          setEmployerDownloadUrl(url);
        }
      }
      if ((contract.status === "worker_signed" || contract.status === "accepted") && !workerDownloadUrl) {
        const { downloadUrl: url } = await api.get(
          `/api/contracts/${contract.id}/download/employee`,
          token
        );
        if (url) {
          setWorkerDownloadUrl(url);
        }
      }
    };

    loadDownloadUrls();
  }, [contract?.id, contract?.employer_contract_url, contract?.status, paramContractId, token]);

  const handleActivate = async () => {
    setActivating(true);
    setError("");

    const { error: activateError } = await api.put(
      `/api/contracts/${contract.id}/activate`,
      {},
      token
    );

    setActivating(false);

    if (activateError) {
      setError(activateError);
      toast.error(activateError);
      return;
    }

    toast.success(t("contracts.copySentSuccess"));
    navigate("/contracts", { replace: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("contracts.loadingContract")}</p>
        </div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigate("/contracts")}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("contracts.back")}
        </button>
        <div className="bg-white rounded-2xl p-6 border border-[#E7D5B8] flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-[#5C3A1E]/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const workerSigned = contract.status === "worker_signed";
  const alreadyAccepted = contract.status === "accepted";
  const isFinalized = contract.status === "finalized";
  const isTerminationPending = Boolean(alreadyAccepted && contract.termination);
  const isRejected = contract.status === "rejected";
  const schedule = contract.schedule || [];

  const weekDayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const sortedSchedule = [...schedule].sort(
    (a, b) => weekDayOrder.indexOf(a.week_day) - weekDayOrder.indexOf(b.week_day)
  );

  if (isRejected) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate("/contracts")}
            className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("contracts.back")}
          </button>
          <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("contracts.contractRejectedTitle")}
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">
            {t("contracts.contractRejectedDescription")}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FEE2E2] border border-[#FCA5A5] px-5 py-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#991B1B]">{t("contracts.statusRejected")}</p>
            <p className="text-xs text-[#991B1B]/70 mt-1">{contract.title}</p>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyAccepted || isFinalized) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate("/contracts")}
            className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("contracts.back")}
          </button>
          <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {isFinalized ? t("contracts.finalizedContractTitle") : isTerminationPending ? t("contracts.terminationPendingTitle") : t("contracts.activeContract")}
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">
            {isFinalized
              ? `${t("contracts.finalizedOn")} ${formatDate(contract.termination?.terminated_at)}`
              : isTerminationPending
                ? `${t("contracts.terminationInitiatedOn")} ${formatDate(contract.termination?.created_at)}`
                : `${contract.title} • ${contract.employee?.user?.full_name || "—"} • ${t("contracts.acceptedOn")} ${formatDate(contract.accepted_at)}`}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
          <div className="space-y-5">
            <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
                {t("contracts.contractDetails")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.salary")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E]">{formatCurrency(contract.salary)}</p>
                </div>
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.startDate")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E]">{formatDate(contract.start_date)}</p>
                </div>
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.endDate")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E]">{contract.end_date ? formatDate(contract.end_date) : t("contracts.indefinite")}</p>
                </div>
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.worker")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E] truncate">{contract.employee?.user?.full_name || "—"}</p>
                </div>
              </div>

              {sortedSchedule.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
                    {t("contracts.schedule")}
                  </p>
                  <div className="space-y-2">
                    {sortedSchedule.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-xl bg-[#FBF5E0] px-4 py-2.5">
                        <p className="text-sm font-semibold text-[#2C1A0E]">{s.week_day}</p>
                        <p className="text-xs text-[#5C3A1E]/60">{s.start_time} — {s.end_time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
                {t("contracts.contractDocuments")}
              </p>
              <div className="mt-4 space-y-3">
                {employerDownloadUrl && (
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF0E8] border border-[#D06224]/20 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#D06224]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#D06224]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2C1A0E] truncate">{t("contracts.originalContract")}</p>
                        <p className="text-xs text-[#5C3A1E]/50">{t("contracts.yourUploadedDocument")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(employerDownloadUrl, "_blank")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D06224] text-white text-xs font-semibold hover:bg-[#B54F1A] transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("contracts.download")}
                    </button>
                  </div>
                )}
                {workerDownloadUrl && (
                  <div className="flex items-center justify-between rounded-xl bg-[#E8F5EE] border border-[#2F855A]/20 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#2F855A]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#2F855A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2C1A0E] truncate">{t("contracts.workerSignedCopy")}</p>
                        <p className="text-xs text-[#2F855A]/60">{t("contracts.workerSignedDocument")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(workerDownloadUrl, "_blank")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2F855A] text-white text-xs font-semibold hover:bg-[#236b43] transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("contracts.download")}
                    </button>
                  </div>
                )}
              </div>
            </section>

            <ContractTerminationPanel
              contract={contract}
              token={token}
              user={user}
              onContractUpdate={setContract}
            />
          </div>

          <aside className="space-y-4">
            <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
                {t("contracts.processStatus")}
              </p>
              <div className="mt-5">
                <ProcessStep title={t("contracts.offerAccepted")} subtitle={t("contracts.processCompleted")} done />
                <ProcessStep title={t("contracts.sendContract")} subtitle={t("contracts.processCompleted")} done />
                <ProcessStep title={t("contracts.workerSignature")} subtitle={t("contracts.processCompleted")} done />
                <ProcessStep title={t("contracts.contractActivation")} subtitle={t("contracts.processCompleted")} done />
              </div>
            </section>

            <section className="rounded-2xl bg-[#E8F5EE] border border-[#2F855A]/30 px-4 py-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-[#2F855A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#2F855A]" />
              </div>
              <p className="text-sm text-[#2F855A] leading-relaxed">
                {isFinalized ? t("contracts.contractFinalizedDescription") : isTerminationPending ? t("contracts.terminationPendingDescription") : t("contracts.contractActiveDescriptionEmployer")}
              </p>
            </section>

            <button
              type="button"
              onClick={() => navigate("/contracts", { replace: true })}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-all"
              style={{ backgroundColor: "#2F855A", boxShadow: "0 8px 24px rgba(47,133,90,0.35)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("contracts.backToContracts")}
            </button>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate("/contracts")}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("contracts.back")}
        </button>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("contracts.reviewSignedCopies")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {contract.title} • {contract.employee?.user?.full_name || "—"}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5">
          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
              {t("contracts.contractDetails")}
            </p>
            <div className="mt-4 rounded-2xl bg-[#FBF5E0] p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-[#D06224]">
                {(contract.employee?.user?.full_name || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-[#2C1A0E] truncate">{contract.employee?.user?.full_name || "—"}</h2>
                <p className="text-sm text-[#5C3A1E]/70 truncate">{contract.title || "—"}</p>
                <p className="text-xs text-[#5C3A1E]/55 mt-1">{t("contracts.salary")}: {formatCurrency(contract.salary)}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2C1A0E]">
                  {t("contracts.contractTitle")} — {contract.employee?.user?.full_name || "—"}
                </h2>
                {contract.accepted_at && (
                  <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
                    {t("contracts.acceptedOn")} {formatDate(contract.accepted_at)}
                  </p>
                )}
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  color: alreadyAccepted ? "#2F855A" : workerSigned ? "#D06224" : "#8C6A10",
                  backgroundColor: alreadyAccepted ? "#22c55e15" : workerSigned ? "#D0622415" : "#8C6A1015",
                }}
              >
                {alreadyAccepted ? t("contracts.processCompleted") : workerSigned ? t("contracts.statusPendingReview") : t("contracts.statusWaitingCopy")}
              </span>
            </div>

            {workerSigned || alreadyAccepted ? (
              <div className="mt-4 rounded-2xl bg-[#E8F5EE] border-2 border-[#2F855A]/30 px-5 py-4">
                <p className="text-xs font-bold text-[#2F855A] uppercase tracking-wide mb-3">
                  {t("contracts.workerSignedContract")}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#2F855A]/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-[#2F855A]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#2C1A0E]">{t("contracts.signedCopy")} — {contract.employee?.user?.full_name}</p>
                    <p className="text-xs text-[#2F855A]/70 mt-0.5">{t("contracts.documentReadyReview")}</p>
                  </div>
                  {workerDownloadUrl && (
                    <button
                      onClick={() => window.open(workerDownloadUrl, "_blank")}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#2F855A]/30 text-[#2F855A] text-sm font-semibold hover:bg-white/50 transition-colors flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      {t("contracts.viewButton")}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-[#FEF6E0] border border-[#8C6A10]/20 px-5 py-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#8C6A10]/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-[#8C6A10]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2C1A0E]">{t("contracts.waitingForWorker")}</p>
                  <p className="text-xs text-[#8C6A10]/70 mt-0.5">{t("contracts.workerNotUploaded")}</p>
                </div>
              </div>
            )}

            <p className="text-xs font-bold text-[#5C3A1E]/50 uppercase tracking-wide mt-6 mb-3">
              {t("contracts.signedCopies")}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#2F855A]/30 bg-[#E8F5EE] p-4 text-center">
                <CheckCircle className="w-6 h-6 text-[#2F855A] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-[#2C1A0E]">{t("contracts.yourCopy")}</p>
                <p className="text-[10px] text-[#2F855A]">{t("contracts.uploadedCheck")}</p>
              </div>

              <div
                className={`rounded-xl border p-4 text-center ${
                  workerSigned || alreadyAccepted
                    ? "border-[#2F855A]/30 bg-[#E8F5EE]"
                    : "border-2 border-dashed border-[#E0A080] bg-[#FFF8F5]"
                }`}
              >
                {workerSigned || alreadyAccepted ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-[#2F855A] mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-[#2C1A0E]">{t("contracts.worker")}</p>
                    <p className="text-[10px] text-[#2F855A]">{t("contracts.signedCheck")}</p>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-[#5C3A1E]/40 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-[#2C1A0E]">{t("contracts.worker")}</p>
                    <p className="text-[10px] text-[#5C3A1E]/60">{t("contracts.pendingBadge")}</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 mb-3">
              <div className="flex justify-between text-xs text-[#5C3A1E]/60 mb-1.5">
                <span>{t("contracts.progressCompleted")}</span>
                <span>{workerSigned || alreadyAccepted ? t("contracts.copiesCount", { current: 2, total: 2 }) : t("contracts.copiesCount", { current: 1, total: 2 })}</span>
              </div>
              <div className="h-1.5 bg-[#EDE8DF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D06224] rounded-full transition-all duration-500"
                  style={{ width: workerSigned || alreadyAccepted ? "100%" : "50%" }}
                />
              </div>
            </div>

            {alreadyAccepted ? (
              <div className="mt-4 rounded-lg bg-[#E8F5EE] text-[#2F855A] px-4 py-3 flex items-start gap-2.5 text-sm">
                <CircleCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: t("contracts.contractActiveBadge") }} />
              </div>
            ) : workerSigned ? (
              <div className="mt-4 rounded-lg bg-[#E8F5EE] text-[#2F855A] px-4 py-3 flex items-start gap-2.5 text-sm">
                <CircleCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t("contracts.reviewAndActivate")}</span>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[#FEF6E0] text-[#8C6A10] px-4 py-3 flex items-start gap-2.5 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{t("contracts.waitingForUpload")}</span>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
              {t("contracts.processStatus")}
            </p>
            <div className="mt-5">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: "#2F855A", borderColor: "#2F855A" }} />
                  <div className="w-px flex-1 min-h-7 bg-[#E7D5B8] mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold" style={{ color: "#2F855A" }}>{t("contracts.offerAccepted")}</p>
                  <p className="text-xs text-[#5C3A1E]/60 mt-1">{t("contracts.processCompleted")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-3.5 h-3.5 rounded-full border-2" style={{ backgroundColor: "#2F855A", borderColor: "#2F855A" }} />
                  <div className="w-px flex-1 min-h-7 bg-[#E7D5B8] mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold" style={{ color: "#2F855A" }}>{t("contracts.sendContract")}</p>
                  <p className="text-xs text-[#5C3A1E]/60 mt-1">{t("contracts.processCompleted")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      backgroundColor: workerSigned || alreadyAccepted ? "#2F855A" : "#D06224",
                      borderColor: workerSigned || alreadyAccepted ? "#2F855A" : "#D06224",
                    }}
                  />
                  <div className="w-px flex-1 min-h-7 bg-[#E7D5B8] mt-1" />
                </div>
                <div className="pb-4">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: workerSigned || alreadyAccepted ? "#2F855A" : "#D06224" }}
                  >
                    {t("contracts.workerSignature")}
                  </p>
                  <p className="text-xs text-[#5C3A1E]/60 mt-1">
                    {alreadyAccepted ? t("contracts.processCompleted") : workerSigned ? t("contracts.processCompleted") : t("contracts.processPending")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2"
                    style={{
                      backgroundColor: alreadyAccepted ? "#2F855A" : workerSigned ? "#D06224" : "#FBF5E0",
                      borderColor: alreadyAccepted ? "#2F855A" : workerSigned ? "#D06224" : "#E7D5B8",
                    }}
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: alreadyAccepted ? "#2F855A" : workerSigned ? "#D06224" : "#5C3A1E" }}
                  >
                    {t("contracts.contractActivation")}
                  </p>
                  <p className="text-xs text-[#5C3A1E]/60 mt-1">
                    {alreadyAccepted ? t("contracts.processCompleted") : workerSigned ? t("contracts.currentStep") : t("contracts.processPending")}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-[#EAF1FF] border border-[#A9C4FF] px-4 py-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border border-[#3B82F6] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            </div>
            <p className="text-sm text-[#2563EB] leading-relaxed">
              {t("contracts.reviewNotice")}
            </p>
          </section>

          <button
            type="button"
            onClick={handleActivate}
            disabled={activating || !workerSigned || alreadyAccepted}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#D06224", boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }}
          >
            {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {activating ? t("contracts.activating") : alreadyAccepted ? t("contracts.contractActiveBtn") : t("contracts.activateContract")}
          </button>

          <p className="text-xs text-[#5C3A1E]/50 px-1" dangerouslySetInnerHTML={{ __html: t("contracts.activateInfo") }} />
        </aside>
      </div>
    </div>
  );
}
