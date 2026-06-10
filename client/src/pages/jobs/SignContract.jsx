import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
  Download,
  Eye,
  FileText,
  Loader2,
  Upload,
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

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
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

export default function SignContract({ contractId: propContractId }) {
  const { contractId: paramContractId } = useParams();
  const contractId = propContractId || paramContractId;
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const fileInputRef = useRef(null);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [contract, setContract] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [workerDownloadUrl, setWorkerDownloadUrl] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadContract = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");

    const {
      contract: fetchedContract,
      termination,
      terminationResponses,
      error: fetchError,
    } = await api.get(`/api/contracts/${contractId}`, token);

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

    if (fetchedContract.status === "worker_signed" || fetchedContract.status === "accepted") {
      setUploaded(true);
    }
  }, [contractId, token, t]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  useCurrentContractRealtime(contractId, () => {
    loadContract(true);
  });

  useEffect(() => {
    if (!contractId) return;
    const interval = setInterval(() => loadContract(true), 3000);
    return () => clearInterval(interval);
  }, [contractId, loadContract]);

  useEffect(() => {
    const loadDownloadUrl = async () => {
      if (!token) return;
      if (!contract?.employer_contract_url) return;

      const { downloadUrl: url, error: urlError } = await api.get(
        `/api/contracts/${contractId}/download/employer`,
        token
      );
      if (url) {
        setDownloadUrl(url);
      }
    };

    loadDownloadUrl();
  }, [contract?.id, contractId, token, contract?.employer_contract_url]);

  const handleFile = (file) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error(t("contracts.onlyPDFError"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("contracts.maxSizeError"));
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const loadWorkerDownloadUrl = async () => {
      if (!token || !contractId) return;
      if ((uploaded || contract?.status === "accepted") && !workerDownloadUrl) {
        const { downloadUrl: url } = await api.get(
          `/api/contracts/${contractId}/download/employee`,
          token
        );
        if (url) {
          setWorkerDownloadUrl(url);
        }
      }
    };

    loadWorkerDownloadUrl();
  }, [uploaded, contract?.status, contractId, token]);

  const handleAccept = async () => {
    if (!selectedFile) {
      setError(t("contracts.uploadFileError"));
      return;
    }

    setSigning(true);
    setError("");
    setUploading(true);
    setUploadProgress(0);

    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.random() * 15 + 5;
        return Math.min(next, 90);
      });
    }, 150);

    try {
      const fileBase64 = await readFileAsBase64(selectedFile);

      clearInterval(uploadInterval);
      setUploadProgress(100);

      const { error: signError } = await api.put(
        `/api/contracts/${contractId}/sign`,
        { fileBase64, fileName: selectedFile.name },
        token
      );

      setUploading(false);

      if (signError) {
        setError(signError);
        toast.error(signError);
        return;
      }

      toast.success(t("contracts.copySentSuccess"));
      setUploaded(true);
      setUploading(false);
    } catch (err) {
      clearInterval(uploadInterval);
      setUploading(false);
      setError(err.message || t("contracts.signContractError"));
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setError("");

    const { contract: updatedContract, error: rejectError } = await api.put(
      `/api/contracts/${contractId}/reject`,
      {},
      token
    );

    if (rejectError) {
      setRejecting(false);
      setError(rejectError);
      toast.error(rejectError || t("contracts.rejectContractError"));
      return;
    }

    setRejecting(false);
    setShowRejectModal(false);
    setContract(updatedContract || { ...contract, status: "rejected" });
    toast.success(t("contracts.rejectContractSuccess"));
    navigate("/contracts", { replace: true });
  };

  const openRejectModal = () => setShowRejectModal(true);
  const closeRejectModal = () => {
    if (rejecting) return;
    setShowRejectModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">Cargando contrato...</p>
        </div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigate(-1)}
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

  const employer = contract.employer?.user || {};
  const isAccepted = contract.status === "accepted";
  const isFinalized = contract.status === "finalized";
  const isTerminationPending = Boolean(isAccepted && contract.termination);
  const isRejected = contract.status === "rejected";
  const schedule = contract.schedule || [];

  const weekDayOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const sortedSchedule = [...schedule].sort(
    (a, b) => weekDayOrder.indexOf(a.week_day) - weekDayOrder.indexOf(b.week_day)
  );

  if (isAccepted || isFinalized) {
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
                : `${contract.title} • ${t("contracts.acceptedOn")} ${formatDate(contract.accepted_at)}`}
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
                  <p className="text-xs text-[#5C3A1E]/50 mb-1">{t("contracts.employer")}</p>
                  <p className="text-sm font-bold text-[#2C1A0E] truncate">{employer.full_name || "—"}</p>
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
                {downloadUrl && (
                  <div className="flex items-center justify-between rounded-xl bg-[#FAF0E8] border border-[#D06224]/20 px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#D06224]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#D06224]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#2C1A0E] truncate">{t("contracts.originalContract")}</p>
                        <p className="text-xs text-[#5C3A1E]/50">{t("contracts.employerDocument")}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(downloadUrl, "_blank")}
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
                        <p className="text-sm font-semibold text-[#2C1A0E] truncate">{t("contracts.yourSignedCopy")}</p>
                        <p className="text-xs text-[#2F855A]/60">{t("contracts.yourUploadedDocument")}</p>
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
                {isFinalized ? t("contracts.contractFinalizedDescription") : isTerminationPending ? t("contracts.terminationPendingDescription") : t("contracts.contractActiveDescription")}
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

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("contracts.back")}
        </button>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("contracts.signContractTitle")} {employer.full_name || t("contracts.unknownEmployer")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {t("contracts.validUntil")} {formatDate(contract.expires_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5">
          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2C1A0E]">
                  {t("contracts.contractTitle")} {contract.title}
                </h2>
                {contract.accepted_at && (
                  <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
                    {t("contracts.acceptedOn")} {formatDate(contract.accepted_at)}
                  </p>
                )}
              </div>
            </div>

            {downloadUrl ? (
              <div className="mt-4 rounded-xl bg-[#FAF0E8] border border-[#D06224]/20 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D06224]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#D06224]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#D06224] truncate">{t("contracts.originalContractPdf")}</p>
                  <p className="text-xs text-[#5C3A1E]/50">{t("contracts.employerSentDocument")}</p>
                </div>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D06224] text-white text-xs font-semibold hover:bg-[#B54F1A] transition-colors flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("contracts.download")}
                </a>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-[#5C3A1E]/60">
                {t("contracts.noContractAvailable")}
              </div>
            )}

            <p className="text-xs font-bold text-[#5C3A1E]/50 uppercase tracking-wide mt-5 mb-3">
              {t("contracts.signedCopies")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#2F855A]/30 bg-[#E8F5EE] p-5 text-center">
                <div className="flex justify-center mb-2.5">
                  <CheckCircle className="w-7 h-7 text-[#2F855A]" />
                </div>
                <p className="text-sm font-bold text-[#2C1A0E]">{t("contracts.employer")}</p>
                <p className="text-xs text-[#2F855A] mt-0.5">{t("contracts.uploaded")}</p>
                {downloadUrl && (
                  <button
                    onClick={() => window.open(downloadUrl, "_blank")}
                    className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-lg border border-[#2F855A]/30 text-xs font-semibold text-[#2F855A] bg-transparent hover:bg-white/50 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t("contracts.view")}
                  </button>
                )}
              </div>

              {uploaded ? (
                <div className="rounded-2xl border border-[#2F855A]/30 bg-[#E8F5EE] p-5 text-center">
                  <div className="flex justify-center mb-2.5">
                    <CheckCircle className="w-7 h-7 text-[#2F855A]" />
                  </div>
                  <p className="text-sm font-bold text-[#2C1A0E]">{t("contracts.worker")}</p>
                  <p className="text-xs text-[#2F855A] mt-0.5">{t("contracts.uploaded")}</p>
                  {workerDownloadUrl && (
                    <button
                      onClick={() => window.open(workerDownloadUrl, "_blank")}
                      className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-lg border border-[#2F855A]/30 text-xs font-semibold text-[#2F855A] bg-transparent hover:bg-white/50 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {t("contracts.view")}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className={`rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                    selectedFile
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-[#E0A080] bg-[#FFF8F5] hover:border-[#D06224] hover:bg-[#FAF0E8]"
                  } cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={handleInputChange}
                  />

                  {selectedFile ? (
                    <>
                      <div className="flex justify-center mb-2.5">
                        <CheckCircle2 className="w-7 h-7 text-[#2F855A]" />
                      </div>
                      <p className="text-sm font-bold text-[#2C1A0E] truncate">{selectedFile.name}</p>
                      <p className="text-xs text-[#2F855A] mt-0.5">{t("contracts.readyToUpload")}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                        className="mt-2 text-xs font-semibold text-red-500 hover:text-red-700"
                      >
                        {t("contracts.remove")}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-center mb-2.5">
                        <Upload className="w-7 h-7 text-[#5C3A1E]/40" />
                      </div>
                      <p className="text-sm font-bold text-[#2C1A0E]">{t("contracts.worker")}</p>
                      <p className="text-xs text-[#5C3A1E]/60 mt-0.5">{t("contracts.workerPending")}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-lg border border-[#E7D5B8] text-xs font-semibold text-[#2C1A0E] bg-white hover:bg-[#FBF5E0] transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {t("contracts.upload")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="mt-5 mb-3">
              <div className="flex justify-between text-xs text-[#5C3A1E]/60 mb-1.5">
                <span>{t("contracts.progressCompleted")}</span>
                <span>{t("contracts.copiesCount", { current: selectedFile || uploaded ? 2 : 1, total: 2 })}</span>
              </div>
              <div className="h-1.5 bg-[#EDE8DF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D06224] rounded-full transition-all duration-500"
                  style={{ width: selectedFile || uploaded ? "100%" : "50%" }}
                />
              </div>
            </div>

            {uploaded ? (
              <div className="mt-3 rounded-lg bg-[#E8F5EE] text-[#2F855A] px-4 py-3 flex items-start gap-2.5 text-sm">
                <CircleCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: t("contracts.copySentNotice") }} />
              </div>
            ) : selectedFile ? (
              <div className="mt-3 rounded-lg bg-[#E8F5EE] text-[#2F855A] px-4 py-3 flex items-start gap-2.5 text-sm">
                <CircleCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: t("contracts.copyReady") }} />
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-[#FEF6E0] text-[#8C6A10] px-4 py-3 flex items-start gap-2.5 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span dangerouslySetInnerHTML={{ __html: t("contracts.contractComplete") }} />
              </div>
            )}

            <p className="mt-4 text-xs text-[#5C3A1E]/50 leading-relaxed">
              {t("contracts.legalDisclaimer")}
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
              {t("contracts.processStatus")}
            </p>
            <div className="mt-5">
              <ProcessStep title={t("contracts.offerAccepted")} subtitle={t("contracts.processCompleted")} done />
              <ProcessStep title={t("contracts.sendContract")} subtitle={t("contracts.processCompleted")} done />
              <ProcessStep
                title={t("contracts.workerSignature")}
                subtitle={uploaded ? t("contracts.processCompleted") : t("contracts.currentStep")}
                done={uploaded}
                active={!uploaded}
              />
              <ProcessStep title={t("contracts.contractActivation")} subtitle={t("contracts.processPending")} />
            </div>
          </section>

          <section className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">
              {t("contracts.eachPartyAccess")}
            </p>
          </section>

          {!uploaded && selectedFile && (
            <button
              type="button"
              onClick={handleAccept}
              disabled={signing}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#2F855A", boxShadow: "0 8px 24px rgba(47,133,90,0.35)" }}
            >
              {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {signing ? t("contracts.signing") : t("contracts.signAndAccept")}
            </button>
          )}

          {!uploaded && (
            <button
              type="button"
              onClick={openRejectModal}
              disabled={rejecting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-semibold border border-red-200 hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4" />
              {t("contracts.rejectContract")}
            </button>
          )}
        </aside>
      </div>
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeRejectModal} />
          <div className="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#D06224]/10">
              <h2 className="text-xl font-bold text-[#2C1A0E]">
                {t("contracts.rejectContractTitle")}
              </h2>
              <button
                onClick={closeRejectModal}
                className="text-[#5C3A1E]/60 hover:text-[#5C3A1E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-[#5C3A1E]/70 mb-6">
                {t("contracts.rejectContractConfirm")}
              </p>

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={rejecting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#5C3A1E] hover:bg-gray-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t("contracts.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejecting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {rejecting ? t("contracts.rejecting") : t("contracts.rejectContract")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
