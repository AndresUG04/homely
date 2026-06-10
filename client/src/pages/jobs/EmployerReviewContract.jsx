import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import { toast } from "sonner";
import { useCurrentContractRealtime } from "../../hooks/useContractRealtime";
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

const TREATMENT_OPTIONS = [
  { label: "Muy amable", positive: true },
  { label: "Respetuoso/a", positive: true },
  { label: "Discreto/a", positive: true },
  { label: "Comunicativo/a", positive: true },
  { label: "Puntual", positive: true },
  { label: "Con actitud difícil", positive: false },
  { label: "Poco comunicativo/a", positive: false },
  { label: "Irrespetuoso/a", positive: false },
];

const RESPONSIBILITY_OPTIONS = [
  { label: "Muy responsable", positive: true },
  { label: "Cumple horarios", positive: true },
  { label: "Proactivo/a", positive: true },
  { label: "Ordenado/a", positive: true },
  { label: "Requiere supervisión constante", positive: false },
  { label: "Incumple horarios", positive: false },
  { label: "Descuidado/a", positive: false },
];

function normalizeChipLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const REVIEW_OPTION_SIGNS = new Map(
  [...TREATMENT_OPTIONS, ...RESPONSIBILITY_OPTIONS].map((option) => [
    normalizeChipLabel(option.label),
    option.positive,
  ])
);

function isPositiveReviewChip(label) {
  return REVIEW_OPTION_SIGNS.get(normalizeChipLabel(label)) ?? false;
}

function ReviewChips({ treatment, responsibility }) {
  const treatmentChips = treatment
    ? String(treatment).split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const responsibilityChips = responsibility
    ? String(responsibility).split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const allChips = [...treatmentChips, ...responsibilityChips];

  if (!allChips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {allChips.map((chip) => {
        const positive = isPositiveReviewChip(chip);
        return (
          <span
            key={chip}
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={
              positive
                ? { background: "#E8F5EE", color: "#2F855A" }
                : { background: "#FEE2E2", color: "#DC2626" }
            }
          >
            {chip}
          </span>
        );
      })}
    </div>
  );
}

function getReviewStorageKey(contractId, userId) {
  return `contract-review:${contractId}:${userId}`;
}

function readStoredReview(contractId, userId) {
  if (!contractId || !userId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getReviewStorageKey(contractId, userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredReview(contractId, userId, review) {
  if (!contractId || !userId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getReviewStorageKey(contractId, userId), JSON.stringify(review));
  } catch {
    // Ignore storage failures; the server copy is still the source of truth.
  }
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

  // --- Reseña ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [savedReview, setSavedReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
  treatment: [],
  payment_responsibility: [],
  review: "",
});
  const [savingReview, setSavingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const hasSavedReview = reviewDone || Boolean(savedReview);
  const isEmployerReview = user?.role === "employer";
  const reviewTarget = isEmployerReview ? contract?.employee?.user : contract?.employer?.user;
  const reviewTargetName = reviewTarget?.full_name || (isEmployerReview ? "la persona trabajadora" : "el empleador");
  const reviewTargetProfileLabel = isEmployerReview ? "perfil de la trabajadora" : "perfil del empleador";
  const reviewSectionTitle = isEmployerReview ? "Reseña de la trabajadora" : "Reseña del empleador";
  const toggleOption = (field, value) => {
    setReviewForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };
  useEffect(() => {
    const loadContract = async () => {
  const loadContract = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");

      const {
        contract: fetchedContract,
        termination,
        terminationResponses,
        reference,
        error: fetchError,
      } = await api.get(`/api/contracts/${paramContractId}`, token);
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
        reference: reference || null,
      });
      const persistedReview = reference || readStoredReview(fetchedContract.id, user?.id) || null;
      setSavedReview(persistedReview);
      setReviewDone(Boolean(persistedReview));
      setLoading(false);
    };
    setContract({
      ...fetchedContract,
      termination,
      terminationResponses: terminationResponses || [],
    });
    setLoading(false);
  }, [paramContractId, token, t]);

  useEffect(() => {
    loadContract();
  }, [paramContractId, token, t, user?.id]);
  }, [loadContract]);

  useCurrentContractRealtime(paramContractId, () => {
    loadContract(true);
  });

  useEffect(() => {
    if (!paramContractId) return;
    const interval = setInterval(() => loadContract(true), 3000);
    return () => clearInterval(interval);
  }, [paramContractId, loadContract]);

  useEffect(() => {
    const loadDownloadUrls = async () => {
      if (!token || !contract?.id) return;

      if (contract.employer_contract_url && !employerDownloadUrl) {
        const { downloadUrl: url } = await api.get(
          `/api/contracts/${contract.id}/download/employer`,
          token
        );
        if (url) setEmployerDownloadUrl(url);
      }
      if (
        (contract.status === "worker_signed" || contract.status === "accepted") &&
        !workerDownloadUrl
      ) {
        const { downloadUrl: url } = await api.get(
          `/api/contracts/${contract.id}/download/employee`,
          token
        );
        if (url) setWorkerDownloadUrl(url);
      }
    };

    loadDownloadUrls();
  }, [
    contract?.id,
    contract?.employer_contract_url,
    contract?.status,
    employerDownloadUrl,
    workerDownloadUrl,
    paramContractId,
    token,
  ]);

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

const handleSaveReview = async () => {
  setSavingReview(true);

  const payload = isEmployerReview
    ? {
        treatment: reviewForm.treatment.join(", "),
        payment_responsibility: reviewForm.payment_responsibility.join(", "),
        review: reviewForm.review,
      }
    : {
        performance: reviewForm.treatment.join(", "),
        punctuality: reviewForm.payment_responsibility.join(", "),
        review: reviewForm.review,
      };

  const targetUserId = isEmployerReview ? contract.employee_user_id : contract.employer_user_id;

  const { error: reviewError } = await api.post(
    `/api/users/${targetUserId}/reference`,
    payload,
    token
  );

  setSavingReview(false);

  if (reviewError) {
    toast.error(reviewError);
    return;
  }

  toast.success("Reseña guardada correctamente");
  setShowReviewModal(false);
  setReviewDone(true);
  const reviewSnapshot = isEmployerReview
    ? {
        treatment: payload.treatment,
        payment_responsibility: payload.payment_responsibility,
        review: payload.review,
      }
    : {
        performance: payload.performance,
        punctuality: payload.punctuality,
        review: payload.review,
      };
  setSavedReview(reviewSnapshot);
  writeStoredReview(contract.id, user?.id, reviewSnapshot);
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
          <h1
            className="text-3xl font-bold text-[#2C1A0E]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
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
            <p className="text-sm font-semibold text-[#991B1B]">
              {t("contracts.statusRejected")}
            </p>
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
          <h1
            className="text-3xl font-bold text-[#2C1A0E]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {isFinalized
              ? t("contracts.finalizedContractTitle")
              : isTerminationPending
              ? t("contracts.terminationPendingTitle")
              : t("contracts.activeContract")}
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">
            {isFinalized
              ? `${t("contracts.finalizedOn")} ${formatDate(contract.termination?.terminated_at)}`
              : isTerminationPending
              ? `${t("contracts.terminationInitiatedOn")} ${formatDate(contract.termination?.created_at)}`
              : `${contract.title} • ${contract.employee?.user?.full_name || "—"} • ${t(
                  "contracts.acceptedOn"
                )} ${formatDate(contract.accepted_at)}`}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
          <div className="space-y-5">
            {/* Detalles del contrato */}
            <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
                {t("contracts.contractDetails")}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.salary")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E]">
                    {formatCurrency(contract.salary)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.startDate")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E]">
                    {formatDate(contract.start_date)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.endDate")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E]">
                    {contract.end_date ? formatDate(contract.end_date) : t("contracts.indefinite")}
                  </p>
                </div>
                <div className="rounded-xl bg-[#FBF5E0] px-4 py-3">
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.worker")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E] truncate">
                    {contract.employee?.user?.full_name || "—"}
                  </p>
                </div>
              </div>

              {sortedSchedule.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
                    {t("contracts.schedule")}
                  </p>
                  <div className="space-y-2">
                    {sortedSchedule.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl bg-[#FBF5E0] px-4 py-2.5"
                      >
                        <p className="text-sm font-semibold text-[#2C1A0E]">{s.week_day}</p>
                        <p className="text-xs text-[#5C3A1E]/60">
                          {s.start_time} — {s.end_time}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Documentos */}
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
                        <p className="text-sm font-semibold text-[#2C1A0E] truncate">
                          {t("contracts.originalContract")}
                        </p>
                        <p className="text-xs text-[#5C3A1E]/50">
                          {t("contracts.yourUploadedDocument")}
                        </p>
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
                        <p className="text-sm font-semibold text-[#2C1A0E] truncate">
                          {t("contracts.workerSignedCopy")}
                        </p>
                        <p className="text-xs text-[#2F855A]/60">
                          {t("contracts.workerSignedDocument")}
                        </p>
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

            {/* Panel de terminación */}
            <ContractTerminationPanel
              contract={contract}
              token={token}
              user={user}
              onContractUpdate={setContract}
            />

            {/* Sección de reseña — solo en contratos finalizados */}
            {isFinalized && (
              <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
                <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
                  {reviewSectionTitle}
                </p>
                {hasSavedReview ? (
                  <div className="rounded-2xl bg-[#FBF5E0] border border-[#E7D5B8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#2C1A0E]">
                          Tu reseña guardada
                        </p>
                        <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
                          Se mostrará también en el {reviewTargetProfileLabel}.
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#2F855A] flex-shrink-0" />
                    </div>
                    <ReviewChips
                      treatment={savedReview?.treatment ?? savedReview?.performance}
                      responsibility={savedReview?.payment_responsibility ?? savedReview?.punctuality}
                    />
                    {savedReview?.review && (
                      <p className="text-sm text-[#5C3A1E] italic mt-3 leading-relaxed">
                        “{savedReview.review}”
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#5C3A1E]/70 mb-4">
                      Dejá tu retroalimentación sobre{" "}
                      <span className="font-semibold text-[#2C1A0E]">
                        {reviewTargetName}
                      </span>
                      . Esta reseña será visible en su perfil.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: "#D06224",
                        boxShadow: "0 4px 12px rgba(208,98,36,0.25)",
                      }}
                    >
                      <Star className="w-4 h-4" />
                      Dejar reseña
                    </button>
                  </>
                )}
              </section>
            )}
          </div>

          {/* Aside derecho */}
          <aside className="space-y-4">
            <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
                {t("contracts.processStatus")}
              </p>
              <div className="mt-5">
                <ProcessStep
                  title={t("contracts.offerAccepted")}
                  subtitle={t("contracts.processCompleted")}
                  done
                />
                <ProcessStep
                  title={t("contracts.sendContract")}
                  subtitle={t("contracts.processCompleted")}
                  done
                />
                <ProcessStep
                  title={t("contracts.workerSignature")}
                  subtitle={t("contracts.processCompleted")}
                  done
                />
                <ProcessStep
                  title={t("contracts.contractActivation")}
                  subtitle={t("contracts.processCompleted")}
                  done
                />
              </div>
            </section>

            <section className="rounded-2xl bg-[#E8F5EE] border border-[#2F855A]/30 px-4 py-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full border border-[#2F855A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#2F855A]" />
              </div>
              <p className="text-sm text-[#2F855A] leading-relaxed">
                {isFinalized
                  ? t("contracts.contractFinalizedDescription")
                  : isTerminationPending
                  ? t("contracts.terminationPendingDescription")
                  : t("contracts.contractActiveDescriptionEmployer")}
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

        {/* Modal de reseña */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowReviewModal(false)}
            />
            <div className="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-[#D06224]/10">
                <div>
                  <h2
                    className="text-xl font-bold text-[#2C1A0E]"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {reviewSectionTitle}
                  </h2>
                  <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
                    {reviewTargetName}
                  </p>
                </div>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-[#5C3A1E]/50 hover:text-[#5C3A1E] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

        <div className="p-6 space-y-5">

  {/* Trato */}
  <div>
    <label className="text-sm font-semibold text-[#2C1A0E] block mb-1">
      ¿Cómo fue el trato?
    </label>
    <p className="text-xs text-[#5C3A1E]/50 mb-2">
      Podés seleccionar varias opciones
    </p>
    <div className="flex flex-wrap gap-2">
      {TREATMENT_OPTIONS.map(opt => {
        const sel = reviewForm.treatment.includes(opt.label);
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => toggleOption("treatment", opt.label)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: sel
                ? (opt.positive ? "#2F855A" : "#DC2626")
                : "#E7D5B8",
              background: sel
                ? (opt.positive ? "#E8F5EE" : "#FEE2E2")
                : "transparent",
              color: sel
                ? (opt.positive ? "#2F855A" : "#DC2626")
                : "#5C3A1E",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>

  {/* Responsabilidad */}
  <div>
    <label className="text-sm font-semibold text-[#2C1A0E] block mb-1">
      Responsabilidad laboral
    </label>
    <p className="text-xs text-[#5C3A1E]/50 mb-2">
      Podés seleccionar varias opciones
    </p>
    <div className="flex flex-wrap gap-2">
      {RESPONSIBILITY_OPTIONS.map(opt => {
        const sel = reviewForm.payment_responsibility.includes(opt.label);
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => toggleOption("payment_responsibility", opt.label)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            style={{
              borderColor: sel
                ? (opt.positive ? "#2F855A" : "#DC2626")
                : "#E7D5B8",
              background: sel
                ? (opt.positive ? "#E8F5EE" : "#FEE2E2")
                : "transparent",
              color: sel
                ? (opt.positive ? "#2F855A" : "#DC2626")
                : "#5C3A1E",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>

  {/* Comentario libre */}
  <div>
    <label className="text-sm font-semibold text-[#2C1A0E] block mb-1">
      Comentario adicional
      <span className="text-[#5C3A1E]/50 font-normal ml-1">(opcional)</span>
    </label>
    <textarea
      rows={3}
      value={reviewForm.review}
      onChange={e => setReviewForm(p => ({ ...p, review: e.target.value }))}
      placeholder={`Contá tu experiencia general trabajando con ${reviewTargetName}...`}
      className="w-full rounded-xl border border-[#E7D5B8] px-3 py-2 text-sm text-[#5C3A1E] focus:outline-none focus:border-[#D06224] bg-[#FBF5E0] resize-none transition-colors"
    />
  </div>

  <div className="flex justify-end gap-3 pt-1">
    <button
      type="button"
      onClick={() => setShowReviewModal(false)}
      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#F5EDD6] text-[#5C3A1E] hover:bg-[#EDE0C4] transition-colors"
    >
      Cancelar
    </button>
    <button
      type="button"
      onClick={handleSaveReview}
      disabled={savingReview}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
      style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}
    >
      {savingReview
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : <Star className="w-4 h-4" />}
      {savingReview ? "Guardando..." : "Guardar reseña"}
    </button>
  </div>
</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Vista de contrato en proceso (pending / worker_signed)
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
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
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
                <h2 className="text-lg font-bold text-[#2C1A0E] truncate">
                  {contract.employee?.user?.full_name || "—"}
                </h2>
                <p className="text-sm text-[#5C3A1E]/70 truncate">{contract.title || "—"}</p>
                <p className="text-xs text-[#5C3A1E]/55 mt-1">
                  {t("contracts.salary")}: {formatCurrency(contract.salary)}
                </p>
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
                  backgroundColor: alreadyAccepted
                    ? "#22c55e15"
                    : workerSigned
                    ? "#D0622415"
                    : "#8C6A1015",
                }}
              >
                {alreadyAccepted
                  ? t("contracts.processCompleted")
                  : workerSigned
                  ? t("contracts.statusPendingReview")
                  : t("contracts.statusWaitingCopy")}
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
                    <p className="text-sm font-semibold text-[#2C1A0E]">
                      {t("contracts.signedCopy")} — {contract.employee?.user?.full_name}
                    </p>
                    <p className="text-xs text-[#2F855A]/70 mt-0.5">
                      {t("contracts.documentReadyReview")}
                    </p>
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
                  <p className="text-sm font-semibold text-[#2C1A0E]">
                    {t("contracts.waitingForWorker")}
                  </p>
                  <p className="text-xs text-[#8C6A10]/70 mt-0.5">
                    {t("contracts.workerNotUploaded")}
                  </p>
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
                <span>
                  {workerSigned || alreadyAccepted
                    ? t("contracts.copiesCount", { current: 2, total: 2 })
                    : t("contracts.copiesCount", { current: 1, total: 2 })}
                </span>
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
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2"
                    style={{ backgroundColor: "#2F855A", borderColor: "#2F855A" }}
                  />
                  <div className="w-px flex-1 min-h-7 bg-[#E7D5B8] mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold" style={{ color: "#2F855A" }}>
                    {t("contracts.offerAccepted")}
                  </p>
                  <p className="text-xs text-[#5C3A1E]/60 mt-1">{t("contracts.processCompleted")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2"
                    style={{ backgroundColor: "#2F855A", borderColor: "#2F855A" }}
                  />
                  <div className="w-px flex-1 min-h-7 bg-[#E7D5B8] mt-1" />
                </div>
                <div className="pb-4">
                  <p className="text-sm font-semibold" style={{ color: "#2F855A" }}>
                    {t("contracts.sendContract")}
                  </p>
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
                    {alreadyAccepted || workerSigned
                      ? t("contracts.processCompleted")
                      : t("contracts.processPending")}
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
                    {alreadyAccepted
                      ? t("contracts.processCompleted")
                      : workerSigned
                      ? t("contracts.currentStep")
                      : t("contracts.processPending")}
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
            {activating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {activating
              ? t("contracts.activating")
              : alreadyAccepted
              ? t("contracts.contractActiveBtn")
              : t("contracts.activateContract")}
          </button>

          <p
            className="text-xs text-[#5C3A1E]/50 px-1"
            dangerouslySetInnerHTML={{ __html: t("contracts.activateInfo") }}
          />
        </aside>
      </div>
    </div>
  );
}