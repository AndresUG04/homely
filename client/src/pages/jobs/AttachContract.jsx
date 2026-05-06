import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  ShieldCheck,
  X,
} from "lucide-react";

function getLocalDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

const today = getLocalDateString();

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `₡${Number(value).toLocaleString("es-CR")}`;
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(`${dateValue}T12:00:00`)
    : new Date(dateValue);

  return normalizedDate.toLocaleDateString("es-CR", {
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

export default function AttachContract({ jobId: propJobId, applicationId: propApplicationId }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const params = useParams();
  const navigation = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const jobId = propJobId || params.jobId || params.id;
  const applicationId = propApplicationId || params.applicationId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [application, setApplication] = useState(null);
  const [job, setJob] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");

  const loadData = useCallback(async () => {
    if (!jobId || !applicationId) {
      setLoading(false);
      setError(t("contracts.missingDataError"));
      return;
    }

    setLoading(true);
    setError("");

    const preloadedApplication = navigation.state?.application;
    const selectedApplication = preloadedApplication?.id === applicationId
      ? preloadedApplication
      : null;

    if (!selectedApplication) {
      const { application: fetchedApplication, error: fetchError } = await api.get(`/api/job-applications/${applicationId}`, token);

      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (!fetchedApplication) {
        setError(t("contracts.applicationNotFoundError"));
        setLoading(false);
        return;
      }

      if (fetchedApplication.job_offer_id && jobId && String(fetchedApplication.job_offer_id) !== String(jobId)) {
        setError(t("contracts.applicationMismatchError"));
        setLoading(false);
        return;
      }

      if (fetchedApplication.status !== "Aceptado") {
        setError(t("contracts.applicationNotAcceptedError"));
        setLoading(false);
        return;
      }

      setApplication(fetchedApplication);
      setJob(fetchedApplication.job_offer || null);
      setEndDate("");
      setLoading(false);
      return;
    }

    if (selectedApplication.status !== "Aceptado") {
      setError(t("contracts.applicationNotAcceptedError"));
      setLoading(false);
      return;
    }

    setApplication(selectedApplication);
    setJob(selectedApplication.job_offer || null);
    setEndDate("");
    setLoading(false);
  }, [applicationId, jobId, navigation.state, token, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const worker = application?.employee?.user || {};
  const jobLocation = job?.address
    ? [job.address.city, job.address.state].filter(Boolean).join(", ") || "—"
    : "—";

  const handleFile = (file) => {
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError(t("contracts.onlyPDFError"));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t("contracts.maxSizeError"));
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError(t("contracts.selectFileError"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const fileBase64 = await readFileAsBase64(selectedFile);

      const { contract, error: submitError } = await api.post(
        `/api/contracts/from-application/${applicationId}`,
        {
          fileName: selectedFile.name,
          fileType: selectedFile.type || "application/pdf",
          fileBase64,
          start_date: startDate,
          end_date: endDate || null,
        },
        token,
      );

      if (submitError) {
        setError(submitError);
        setSaving(false);
        return;
      }

      toast.success(t("contracts.copySentSuccess"));
      navigate(`/contracts/${contract.id}/review`, { replace: true });
    } catch (submitError) {
      setError(submitError?.message || t("contracts.signContractError"));
      setSaving(false);
    }
  };

  const fileLabel = selectedFile
    ? `${selectedFile.name} · ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
    : t("contracts.noFileSelected");

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

  if (error && !application) {
    return (
      <div className="space-y-5">
        <button
          onClick={() => navigate(`/contracts`)}
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

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(`/contracts`)}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("contracts.back")}
        </button>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("contracts.attachContract")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {job?.title || t("contracts.selectedOffer")} · {t("contracts.uploadDigitalContract")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5">
          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
              {t("contracts.associatedWorker")}
            </p>
            <div className="mt-4 rounded-2xl bg-[#FBF5E0] p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold bg-[#D06224]">
                {(worker.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-[#2C1A0E] truncate">{worker.full_name || "—"}</h2>
                <p className="text-sm text-[#5C3A1E]/70 truncate">
                  {job?.title || "—"} {jobLocation !== "—" ? `• ${jobLocation}` : ""}
                </p>
                <p className="text-xs text-[#5C3A1E]/55 mt-1">{t("contracts.salary")}: {formatCurrency(job?.salary)}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-[#D06224]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t("contracts.offerAcceptedBadge")}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
                {t("contracts.contractFile")}
              </p>
              <span className="text-xs text-[#5C3A1E]/45">{t("contracts.pdfMax10MB")}</span>
            </div>

            <div
              className={`mt-4 rounded-2xl border-2 border-dashed transition-colors ${
                dragging ? "border-[#D06224] bg-[#D06224]/5" : "border-[#E7D5B8] bg-white"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handleInputChange}
              />

              <div className="min-h-[235px] flex flex-col items-center justify-center text-center px-6 py-8 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-[#D06224]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#2C1A0E]">
                    <span className="text-[#D06224]">{t("contracts.clickOrDrag")}</span>
                  </p>
                  <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("contracts.onlyPDFs")}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FBF5E0] text-sm text-[#5C3A1E]/70">
                  <Paperclip className="w-4 h-4 text-[#D06224]" />
                  {fileLabel}
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-700/70">{t("contracts.readyToUpload")}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-emerald-700 hover:text-emerald-900 transition-colors"
                  aria-label={t("contracts.removeFile")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-[#FBF5E0] px-4 py-3 text-sm text-[#5C3A1E]/70">
              <div className="flex items-start gap-2">
                <p>{t("contracts.legalDisclaimer")}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
              {t("contracts.contractDates")}
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#2C1A0E]">{t("contracts.startDateLabel")}</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E7D5B8] bg-white px-3.5 py-2.5 text-sm text-[#2C1A0E] focus:border-[#D06224] focus:outline-none focus:ring-2 focus:ring-[#D06224]/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2C1A0E]">
                  {t("contracts.endDateLabel")} <span className="text-[#5C3A1E]/40 font-normal">({t("contracts.optional")})</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E7D5B8] bg-white px-3.5 py-2.5 text-sm text-[#2C1A0E] focus:border-[#D06224] focus:outline-none focus:ring-2 focus:ring-[#D06224]/20"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
              {t("contracts.processStatus")}
            </p>
            <div className="mt-5">
              <ProcessStep title={t("contracts.processStep1")} subtitle="1 mayo 2026" done />
              <ProcessStep title={t("contracts.processStep2")} subtitle={t("contracts.currentStep")} active />
              <ProcessStep title={t("contracts.processStep3")} subtitle={t("contracts.processPending")} />
              <ProcessStep title={t("contracts.processStep4")} subtitle={t("contracts.processPending")} />
            </div>
          </section>

          <section className="rounded-2xl bg-[#EAF1FF] border border-[#A9C4FF] px-4 py-4 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full border border-[#3B82F6] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            </div>
            <p className="text-sm text-[#2563EB] leading-relaxed">
              {t("contracts.storageNotice")}
            </p>
          </section>

          <button
            type="submit"
            disabled={saving || !selectedFile}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#D06224", boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? t("contracts.saving") : t("contracts.saveAndContinue")}
          </button>

          <p className="text-xs text-[#5C3A1E]/50 px-1" dangerouslySetInnerHTML={{ __html: t("contracts.saveInfo") }} />
        </aside>
      </form>
    </div>
  );
}
