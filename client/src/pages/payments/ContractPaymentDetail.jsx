import { useState, useEffect, useRef } from "react";
import { useNavigate  } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  DollarSign,
  Calendar,
} from "lucide-react";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const [year, month, day] = dateValue.split("-");
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—";
  return `₡${Number(value).toLocaleString("es-CR")}`;
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ContractPaymentDetail({ contractId }) {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthOpen, setMonthOpen] = useState(false);
  const isWorker = user?.role === "employee";

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(new Date().getFullYear(), i, 1);
    const value = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
  const selectedLabel = months.find(m => m.value === selectedMonth)?.label;
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const { contract, error } = await api.get(`/api/contracts/${contractId}`, token);
        if (error) setError(error);
        else setContract(contract);
        const { payments } = await api.get(`/api/contracts/${contractId}/payments`, token);
        setPayments(payments || []);
      } catch {
        setError(t("contract_payment_detail.error_loading"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [contractId, token]);

  const handleFile = (f) => {
    if (!f) return;
    const valid = f.type === "application/pdf" || f.type.startsWith("image/");
    if (!valid) { toast.error(t("contract_payment_detail.toast_invalid_file")); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error(t("contract_payment_detail.toast_file_too_large")); return; }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const { error } = await api.post(`/api/contracts/${contractId}/payments`, {
        fileBase64: base64, fileName: file.name, month: selectedMonth,
      }, token);
      if (error) toast.error(error);
      else {
        toast.success(t("contract_payment_detail.toast_upload_success"));
        setFile(null);
        const { payments: updated } = await api.get(`/api/contracts/${contractId}/payments`, token);
        setPayments(updated || []);
      }
    } catch {
      toast.error(t("contract_payment_detail.toast_upload_error"));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#D06224]" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-4 px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#5C3A1E]/60">
          <ArrowLeft className="w-4 h-4" /> {t("contract_payment_detail.back")}
        </button>
        <div className="bg-white rounded-2xl p-5 border border-red-200 flex items-center gap-2 text-red-500">
          <AlertCircle className="w-5 h-5" />
          {error || t("contract_payment_detail.contract_not_found")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> {t("contract_payment_detail.back")}
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("contract_payment_detail.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1 leading-snug">
          {contract.job_offer?.title}
        </p>
      </div>

      {/* CONTRACT CARD */}
      <section className="bg-white rounded-2xl p-4 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
          {t("contract_payment_detail.contract_details")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <div className="rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">
              {isWorker ? t("contract_payment_detail.employer") : t("contract_payment_detail.employee")}
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C1A0E]">
              <User className="w-3.5 h-3.5 text-[#D06224] shrink-0" />
              <span className="truncate">
                {isWorker ? contract.employer?.user?.full_name : contract.employee?.user?.full_name}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{t("contract_payment_detail.salary")}</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C1A0E]">
              <DollarSign className="w-3.5 h-3.5 text-[#D06224] shrink-0" />
              <span className="truncate">{formatCurrency(contract.salary)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{t("contract_payment_detail.start")}</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C1A0E]">
              <Calendar className="w-3.5 h-3.5 text-[#D06224] shrink-0" />
              <span className="truncate">{formatDate(contract.start_date)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{t("contract_payment_detail.end")}</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2C1A0E]">
              <Calendar className="w-3.5 h-3.5 text-[#D06224] shrink-0" />
              <span className="truncate">{formatDate(contract.end_date)}</span>
            </div>
          </div>

        </div>
      </section>

      {/* UPLOAD CARD */}
      {!isWorker && (
        <section className="bg-white rounded-2xl p-4 border border-[#E7D5B8]">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
            {t("contract_payment_detail.monthly_payment")}
          </p>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs font-semibold text-[#5C3A1E]/60">{t("contract_payment_detail.month_to_pay")}</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMonthOpen(prev => !prev)}
                className="w-full flex items-center justify-between rounded-xl border border-[#E7D5B8] bg-[#FBF5E0] px-4 py-3 text-sm font-semibold text-[#2C1A0E] hover:border-[#D06224] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#D06224]" />
                  {selectedLabel}
                </div>
                <svg
                  className={`w-4 h-4 text-[#5C3A1E]/40 transition-transform duration-200 ${monthOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {monthOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-[#E7D5B8] bg-white shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {months.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => { setSelectedMonth(m.value); setMonthOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[#FAF0E8] ${
                        m.value === selectedMonth ? "font-semibold text-[#D06224] bg-[#FBF5E0]" : "text-[#2C1A0E]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E0A080] rounded-xl p-6 text-center cursor-pointer hover:border-[#D06224] hover:bg-[#FAF0E8] transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/*"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {file ? (
              <>
                <CheckCircle className="w-7 h-7 text-[#2F855A] mx-auto mb-2" />
                <p className="font-semibold text-[#2C1A0E] text-sm truncate px-4">{file.name}</p>
                <p className="text-xs text-[#2F855A] mt-1">{t("contract_payment_detail.ready_to_upload")}</p>
              </>
            ) : (
              <>
                <Upload className="font-semibold text-[#2C1A0E] text-sm" />
                <p className="hidden sm:inline">{t("contract_payment_detail.upload_receipt")}</p>
                <p className="sm:hidden">{t("contract_payment_detail.upload_receipt_hint")}</p>
              </>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60"
            style={{ backgroundColor: "#D06224" }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {t("contract_payment_detail.upload_button")}
          </button>
        </section>
      )}

      {/* COMPROBANTES */}
      <section className="bg-white rounded-2xl p-4 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
          {t("contract_payment_detail.uploaded_receipts")}
        </p>

        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#D06224]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#D06224]/40" />
            </div>
            <p className="text-sm text-[#5C3A1E]/60">{t("contract_payment_detail.no_receipts")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="bg-[#FBF5E0] rounded-xl px-3 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                {/* Info del archivo */}
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center border border-[#E7D5B8] shrink-0">
                    <FileText className="w-4 h-4 text-[#D06224]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2C1A0E] truncate">{p.file_name}</p>
                    <p className="text-xs text-[#5C3A1E]/60 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#D06224] shrink-0" />
                      {formatDate(p.period)}
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={async () => {
                      setLoadingPaymentId(p.id);
                      try {
                        const { url, error } = await api.get(
                          `/api/contracts/${contractId}/payments/${p.id}/url`, token
                        );
                        if (error) toast.error(error);
                        else window.open(url, "_blank");
                      } finally {
                        setLoadingPaymentId(null);
                      }
                    }}
                    disabled={loadingPaymentId === p.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#D06224]/10 text-[#D06224] hover:bg-[#D06224]/20 transition-colors disabled:opacity-60"
                  >
                    {loadingPaymentId === p.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <FileText className="w-3 h-3" />
                    }
                    {loadingPaymentId === p.id ? t("contract_payment_detail.loading") : t("contract_payment_detail.view")}
                  </button>

                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    {t("contract_payment_detail.paid")}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}