import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import {
  DollarSign,
  BarChart2,
  Users,
  FileText,
  Clock,
  Download,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
} from "lucide-react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "";

async function apiFetch(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(amount) {
  if (amount == null) return "—";
  return `₡${Number(amount).toLocaleString("es-CR", { minimumFractionDigits: 0 })}`;
}

function fmtPeriod(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CR", {
    month: "long",
    year: "numeric",
  });
}

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── SUBCOMPONENTES ──────────────────────────────────────────────────────────
function Pill({ children, color = "green" }) {
  const cls = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-600 border-red-200",
    gray: "bg-gray-50 text-gray-500 border-gray-200",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

function SectionCard({ icon: Icon, title, children, accentColor = "#D06224", loading }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="bg-white rounded-2xl border border-[#E7D5B8] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#FBF5E0]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor + "18" }}>
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentColor }} />
              : <Icon className="w-4 h-4" style={{ color: accentColor }} />
            }
          </div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">{title}</p>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#5C3A1E]/40" />
          : <ChevronDown className="w-4 h-4 text-[#5C3A1E]/40" />
        }
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

function StatBox({ label, value, sub, highlight, icon: Icon, loading }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-[#D06224]/8 border border-[#D06224]/20" : "bg-[#FBF5E0]"}`}>
      <p className="text-xs text-[#5C3A1E]/60 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#D06224]" />}
        {loading
          ? <div className="h-5 w-20 bg-[#E7D5B8] rounded animate-pulse" />
          : <p className={`font-bold text-lg ${highlight ? "text-[#D06224]" : "text-[#2C1A0E]"}`}>{value}</p>
        }
      </div>
      {sub && <p className="text-xs text-[#5C3A1E]/50 mt-0.5">{sub}</p>}
    </div>
  );
}

function MonthlyBarChart({ data, loading, noDataLabel }) {
  if (loading) return (
    <div className="flex items-end gap-1.5 h-28 mb-2">
      {[60, 80, 100, 70, 90, 85].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md bg-[#E7D5B8] animate-pulse" style={{ height: `${h}%` }} />
        </div>
      ))}
    </div>
  );

  if (!data || data.length === 0)
    return <p className="text-sm text-[#5C3A1E]/60 py-2">{noDataLabel}</p>;

  const max = Math.max(...data.map((d) => d.total));
  return (
    <div>
      <div className="flex items-end gap-1.5 h-28 mb-2">
        {data.map((d, i) => {
          const pct = max > 0 ? Math.round((d.total / max) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-semibold text-[#5C3A1E] leading-none">{fmt(d.total)}</span>
              <div className="w-full rounded-t-md bg-[#D06224] opacity-85" style={{ height: `${Math.max(4, pct)}%`, minHeight: 4 }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] text-[#5C3A1E]/50">{d.mes}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Reports({ onBack }) {
  const { token } = useAuth();
  const { t } = useTranslation();

  const DAY_LABELS = {
    monday:    t("reports.salaryLoad.days.monday"),
    tuesday:   t("reports.salaryLoad.days.tuesday"),
    wednesday: t("reports.salaryLoad.days.wednesday"),
    thursday:  t("reports.salaryLoad.days.thursday"),
    friday:    t("reports.salaryLoad.days.friday"),
    saturday:  t("reports.salaryLoad.days.saturday"),
    sunday:    t("reports.salaryLoad.days.sunday"),
  };

  // ── Estado ────────────────────────────────────────────────────────────────
  const [summary,        setSummary]        = useState(null);
  const [monthlySpend,   setMonthlySpend]   = useState([]);
  const [salaryLoad,     setSalaryLoad]     = useState({ items: [], totals: {} });
  const [receipts,       setReceipts]       = useState([]);
  const [receiptsTotal,  setReceiptsTotal]  = useState(0);
  const [receiptsPage,   setReceiptsPage]   = useState(1);
  const [search,         setSearch]         = useState("");

  const [loadingSummary,  setLoadingSummary]  = useState(true);
  const [loadingMonthly,  setLoadingMonthly]  = useState(true);
  const [loadingSalary,   setLoadingSalary]   = useState(true);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [error,           setError]           = useState(null);

  // ── Fetches ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    apiFetch("/api/reports/summary", token)
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSummary(false));

    apiFetch("/api/reports/monthly-spend", token)
      .then(setMonthlySpend)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMonthly(false));

    apiFetch("/api/reports/salary-load", token)
      .then(setSalaryLoad)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingSalary(false));
  }, [token]);

  const fetchReceipts = useCallback(
    (q = search, page = 1) => {
      if (!token) return;
      setLoadingReceipts(true);
      const params = new URLSearchParams({ page, limit: 20, ...(q ? { search: q } : {}) });
      apiFetch(`/api/reports/receipts?${params}`, token)
        .then((data) => {
          setReceipts(data.data ?? []);
          setReceiptsTotal(data.total ?? 0);
          setReceiptsPage(data.page ?? page);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoadingReceipts(false));
    },
    [token, search]
  );

  useEffect(() => { fetchReceipts(); }, [token]); // eslint-disable-line

  useEffect(() => {
    const t = setTimeout(() => fetchReceipts(search, 1), 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line

  // ── Download ──────────────────────────────────────────────────────────────
  async function handleDownload(id) {
    try {
      const { url } = await apiFetch(`/api/reports/receipts/${id}/download`, token);
      window.open(url, "_blank");
    } catch (e) {
      alert(t("reports.receipts.downloadError", { message: e.message }));
    }
  }

  // ── Derivados ─────────────────────────────────────────────────────────────
  const { items: salaryItems = [], totals: salaryTotals = {} } = salaryLoad;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("reports.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60">{t("reports.subtitle")}</p>
        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {t("reports.error", { message: error })}
          </div>
        )}
      </div>

      {/* ── RESUMEN ── */}
      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-4">
          {t("reports.summary.title")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox
            label={t("reports.summary.activeContracts")}
            value={summary?.activeContracts ?? "—"}
            icon={FileText}
            highlight
            loading={loadingSummary}
          />
          <StatBox
            label={t("reports.summary.monthlySpend")}
            value={fmt(summary?.totalMensual)}
            icon={DollarSign}
            loading={loadingSummary}
          />
          <StatBox
            label={t("reports.summary.weeklyHours")}
            value={summary?.totalHoras != null ? `${summary.totalHoras} h` : "—"}
            icon={Clock}
            loading={loadingSummary}
          />
          <StatBox
            label={t("reports.summary.receiptsCount")}
            value={summary?.receiptsCount ?? "—"}
            icon={FileText}
            loading={loadingSummary}
          />
        </div>
      </section>

      {/* ── GASTO MENSUAL ── */}
      <SectionCard
        icon={BarChart2}
        title={t("reports.monthlySpend.title")}
        accentColor="#D06224"
        loading={loadingMonthly}
      >
        <MonthlyBarChart
          data={monthlySpend}
          loading={loadingMonthly}
          noDataLabel={t("reports.monthlySpend.noData")}
        />
        {!loadingMonthly && (
          <div className="mt-4 bg-[#FBF5E0] rounded-xl p-4 text-sm text-[#5C3A1E]/70">
            <p className="font-semibold text-[#2C1A0E] mb-1">{t("reports.monthlySpend.howTitle")}</p>
            <p>{t("reports.monthlySpend.howDesc")}</p>
          </div>
        )}
      </SectionCard>

      {/* ── CARGA SALARIAL ── */}
      <SectionCard
        icon={Users}
        title={t("reports.salaryLoad.title")}
        accentColor="#2E7D32"
        loading={loadingSalary}
      >
        {loadingSalary ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#FBF5E0] rounded-xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : salaryItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatBox label={t("reports.salaryLoad.totalMonthly")}    value={fmt(salaryTotals.totalMonthlySalary)} highlight />
              <StatBox label={t("reports.salaryLoad.totalAnnual")}     value={fmt(salaryTotals.totalAnnualCost)} />
              <StatBox label={t("reports.salaryLoad.weeklyHours")}     value={salaryTotals.totalWeeklyHours != null ? `${salaryTotals.totalWeeklyHours} h` : "—"} />
              <StatBox label={t("reports.salaryLoad.activeEmployees")} value={salaryTotals.activeContracts ?? "—"} />
            </div>

            <div className="space-y-3">
              {salaryItems.map((emp) => {
                const maxSalary = Math.max(...salaryItems.map((i) => i.monthlySalary));
                const pct = maxSalary > 0 ? Math.round((emp.monthlySalary / maxSalary) * 100) : 0;
                return (
                  <div key={emp.contractId} className="bg-[#FBF5E0] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#D06224]/12 flex items-center justify-center text-xs font-bold text-[#D06224]">
                          {initials(emp.employeeName)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#2C1A0E] text-sm">{emp.employeeName}</p>
                          <p className="text-xs text-[#5C3A1E]/60">{emp.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#2C1A0E] text-sm">
                          {fmt(emp.monthlySalary)}{t("reports.salaryLoad.perMonth")}
                        </p>
                        <p className="text-xs text-[#5C3A1E]/50">
                          {fmt(emp.annualCost)}{t("reports.salaryLoad.perYear")} · {emp.weeklyHours}{t("reports.salaryLoad.hoursPerWeek")}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[#E7D5B8] overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-[#D06224] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(emp.scheduleDays ?? []).map((d, i) => (
                        <div key={i} className="flex items-center gap-1 bg-white border border-[#E7D5B8] rounded-lg px-2.5 py-1">
                          <span className="text-[10px] font-bold text-[#D06224]">
                            {DAY_LABELS[d?.toLowerCase()] ?? d}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between bg-[#2C1A0E] rounded-xl px-4 py-3">
              <span className="text-sm font-semibold text-white/70">{t("reports.salaryLoad.totalLabel")}</span>
              <span className="font-bold text-lg text-white">{fmt(salaryTotals.totalMonthlySalary)}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5C3A1E]/60 py-2">{t("reports.salaryLoad.noContracts")}</p>
        )}
      </SectionCard>

      {/* ── RECIBOS ── */}
      <SectionCard
        icon={FileText}
        title={t("reports.receipts.title")}
        accentColor="#1565C0"
        loading={loadingReceipts}
      >
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C3A1E]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("reports.receipts.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E7D5B8] bg-[#FBF5E0] text-sm text-[#2C1A0E] placeholder:text-[#5C3A1E]/40 outline-none focus:border-[#D06224] transition-colors"
          />
        </div>

        {loadingReceipts ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#FBF5E0] rounded-xl h-14 animate-pulse" />
            ))}
          </div>
        ) : receipts.length > 0 ? (
          <div className="space-y-2">
            {receipts.map((r, i) => (
              <div key={r.id ?? i} className="flex items-center justify-between bg-[#FBF5E0] rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#E7D5B8] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#D06224]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C1A0E] text-sm">{r.employeeName}</p>
                    <p className="text-xs text-[#5C3A1E]/60">{r.title} · {fmtPeriod(r.period)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[#2C1A0E] text-sm">{fmt(r.amount)}</span>
                  <Pill color="green">
                    <CheckCircle className="w-3 h-3" />
                    {t("reports.receipts.paid")}
                  </Pill>
                  <button
                    onClick={() => handleDownload(r.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#5C3A1E] bg-white border border-[#E7D5B8] rounded-lg px-2.5 py-1.5 hover:border-[#D06224] hover:text-[#D06224] transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    {t("reports.receipts.view")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5C3A1E]/60 py-2 text-center">{t("reports.receipts.noResults")}</p>
        )}

        {receiptsTotal > 0 && (
          <div className="mt-4 flex items-center justify-between bg-[#FBF5E0] rounded-xl px-4 py-3 text-sm text-[#5C3A1E]/70">
            <span>
              <span className="font-semibold text-[#2C1A0E]">{t("reports.receipts.page", { page: receiptsPage })}</span>
              {" · "}{t("reports.receipts.showing", { count: receipts.length, total: receiptsTotal })}
            </span>
            <div className="flex gap-2">
              <button
                disabled={receiptsPage <= 1}
                onClick={() => fetchReceipts(search, receiptsPage - 1)}
                className="text-xs font-semibold text-[#5C3A1E] bg-white border border-[#E7D5B8] rounded-lg px-2.5 py-1 disabled:opacity-40 hover:border-[#D06224] transition-colors"
              >
                {t("reports.receipts.prev")}
              </button>
              <button
                disabled={receipts.length < 20}
                onClick={() => fetchReceipts(search, receiptsPage + 1)}
                className="text-xs font-semibold text-[#5C3A1E] bg-white border border-[#E7D5B8] rounded-lg px-2.5 py-1 disabled:opacity-40 hover:border-[#D06224] transition-colors"
              >
                {t("reports.receipts.next")}
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}