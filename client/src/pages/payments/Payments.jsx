import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { useTranslation } from "react-i18next";
import {
  AlertCircle, Calendar, FileText, CheckCircle,
  ArrowLeft, Loader2,
} from "lucide-react";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  const [year, month, day] = dateValue.split("-");
  return new Date(year, month - 1, day).toLocaleDateString("es-CR", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return null;
  return `₡${Number(value).toLocaleString("es-CR")}`;
}

/* ── Tarjeta empleador (vista trabajadora) ── */
function WorkerContractCard({ contract, onClick }) {
  const { t } = useTranslation();
  const employer = contract.employer?.user || {};
  return (
    <button
      onClick={() => onClick(contract)}
      className="w-full text-left bg-white rounded-2xl p-4 border border-[#E7D5B8] transition-all duration-200 hover:shadow-md active:scale-95"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-[#D06224] flex-shrink-0">
            {(employer.full_name || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#2C1A0E] truncate">{employer.full_name || "—"}</h3>
            <p className="text-xs text-[#5C3A1E]/70 truncate mt-0.5">{contract.title || t("payments.contract")}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0" style={{ backgroundColor: "#22c55e15", color: "#22c55e" }}>
          <CheckCircle className="w-3 h-3" />
          {t("payments.active")}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#5C3A1E]/60">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#D06224]" />
          {t("payments.start")}: {formatDate(contract.start_date)}
        </div>
        {contract.salary && <span>{formatCurrency(contract.salary)}</span>}
      </div>
    </button>
  );
}

/* ── Tarjeta empleadora (vista empleador) ── */
function EmployerContractCard({ contract, onClick }) {
  const { t } = useTranslation();
  const employee = contract.employee?.user || {};
  return (
    <button
      onClick={() => onClick(contract)}
      className="w-full text-left bg-white rounded-2xl p-4 border border-[#E7D5B8] transition-all duration-200 hover:shadow-md active:scale-95"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-[#D06224] flex-shrink-0">
            {(employee.full_name || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-[#2C1A0E] truncate">{employee.full_name || "—"}</h3>
            <p className="text-xs text-[#5C3A1E]/70 truncate mt-0.5">{contract.title || t("payments.contract")}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0" style={{ backgroundColor: "#22c55e15", color: "#22c55e" }}>
          <CheckCircle className="w-3 h-3" />
          {t("payments.active")}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#5C3A1E]/60">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#D06224]" />
          {t("payments.start")}: {formatDate(contract.start_date)}
        </div>
        {contract.salary && <span>{formatCurrency(contract.salary)}</span>}
      </div>
    </button>
  );
}

/* ── Vista de pagos recibidos (trabajadora) ── */
function WorkerPaymentDetail({ contract, onBack, token }) {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { payments } = await api.get(`/api/contracts/${contract.id}/payments`, token);
      setPayments(payments || []);
      setLoading(false);
    };
    load();
  }, [contract.id, token]);

  const employer = contract.employer?.user || {};

  return (
    <div className="space-y-4 px-4 pb-8">

      {/* Header */}
      <div className="pt-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] mb-3">
          <ArrowLeft className="w-4 h-4" />
          {t("payments.back")}
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("payments.title_worker")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1 leading-snug">{contract.title}</p>
      </div>

      {/* Detalles */}
      <section className="bg-white rounded-2xl p-4 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
          {t("payments.contract_details")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{t("payments.employer")}</p>
            <p className="text-xs font-semibold text-[#2C1A0E] truncate">{employer.full_name || "—"}</p>
          </div>
          <div className="rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{t("payments.salary")}</p>
            <p className="text-xs font-semibold text-[#2C1A0E] truncate">{formatCurrency(contract.salary) || "—"}</p>
          </div>
          <div className="col-span-2 rounded-xl bg-[#FBF5E0] p-3">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{t("payments.contract_start")}</p>
            <p className="text-xs font-semibold text-[#2C1A0E]">{formatDate(contract.start_date)}</p>
          </div>
        </div>
      </section>

      {/* Comprobantes */}
      <section className="bg-white rounded-2xl p-4 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-3">
          {t("payments.received_receipts")}
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#D06224]" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#D06224]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#D06224]/40" />
            </div>
            <p className="text-sm text-[#5C3A1E]/60">{t("payments.no_receipts")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="bg-[#FBF5E0] rounded-xl px-3 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                {/* Info */}
                <div className="flex items-center gap-3 min-w-0">
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
                      const { url, error } = await api.get(`/api/contracts/${contract.id}/payments/${p.id}/url`, token);
                      if (error) return;
                      window.open(url, "_blank");
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#D06224]/10 text-[#D06224] hover:bg-[#D06224]/20 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {t("payments.view")}
                  </button>
                  <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    {t("payments.paid")}
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

/* ── Principal ── */
export default function Payments() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isWorker = user?.role === "employee" || user?.role === "worker";

  const [contracts, setContracts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { contracts, error } = await api.get("/api/contracts/my", token);
      if (error) { setError(error); setLoading(false); return; }
      const active = (contracts || []).filter(c => c.status === "accepted");
      setContracts(active);
      setLoading(false);
    };
    load();
  }, [token]);

  if (isWorker && selected) {
    return <WorkerPaymentDetail contract={selected} onBack={() => setSelected(null)} token={token} />;
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {isWorker ? t("payments.title_worker") : t("payments.title_employer")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {isWorker ? t("payments.subtitle_worker") : t("payments.subtitle_employer")}
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("payments.loading_contracts")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{error}</p>
        </div>
      ) : contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{t("payments.no_active_contracts")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(c =>
            isWorker ? (
              <WorkerContractCard key={c.id} contract={c} onClick={setSelected} />
            ) : (
              <EmployerContractCard key={c.id} contract={c} onClick={() => navigate(`/payments/${c.id}`)} />
            )
          )}
        </div>
      )}
    </div>
  );
}