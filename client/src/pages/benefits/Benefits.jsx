import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle,
  TrendingUp,
  Award,
  Heart,
  Clock,
  ChevronDown,
  ChevronUp,
  Gift,
  Umbrella,
  Star,
} from "lucide-react";

// ─── FERIADOS COSTA RICA 2025 ────────────────────────────────────────────────
const FERIADOS_CR = [
  { date: "2025-01-01", name: "Año Nuevo",                       obligatorio: true  },
  { date: "2025-04-11", name: "Día de Juan Santamaría",          obligatorio: true  },
  { date: "2025-04-17", name: "Jueves Santo",                    obligatorio: true  },
  { date: "2025-04-18", name: "Viernes Santo",                   obligatorio: true  },
  { date: "2025-05-01", name: "Día del Trabajador",              obligatorio: true  },
  { date: "2025-07-25", name: "Anexión de Guanacaste",           obligatorio: false },
  { date: "2025-08-02", name: "Virgen de los Ángeles",           obligatorio: false },
  { date: "2025-08-15", name: "Día de la Madre",                 obligatorio: true  },
  { date: "2025-09-15", name: "Independencia de Costa Rica",     obligatorio: true  },
  { date: "2025-12-25", name: "Navidad",                         obligatorio: true  },
  // 2026
  { date: "2026-01-01", name: "Año Nuevo",                       obligatorio: true  },
  { date: "2026-04-11", name: "Día de Juan Santamaría",          obligatorio: true  },
  { date: "2026-04-02", name: "Jueves Santo",                    obligatorio: true  },
  { date: "2026-04-03", name: "Viernes Santo",                   obligatorio: true  },
  { date: "2026-05-01", name: "Día del Trabajador",              obligatorio: true  },
  { date: "2026-07-25", name: "Anexión de Guanacaste",           obligatorio: false },
  { date: "2026-08-02", name: "Virgen de los Ángeles",           obligatorio: false },
  { date: "2026-08-15", name: "Día de la Madre",                 obligatorio: true  },
  { date: "2026-09-15", name: "Independencia de Costa Rica",     obligatorio: true  },
  { date: "2026-12-25", name: "Navidad",                         obligatorio: true  },
];

// ─── CONVERSIÓN SALARIO POR HORA → MENSUAL / ANUAL ───────────────────────────
function calcSalaryFromHourly(salarioHora, schedule) {
  if (!salarioHora || !schedule || schedule.length === 0) return null;

  const horasPorDia = schedule.map(s => {
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    return (eh + em / 60) - (sh + sm / 60);
  });

  const horasSemanales = horasPorDia.reduce((a, h) => a + h, 0);
  const diasSemanales  = schedule.length;
  const salarioMensual = salarioHora * horasSemanales * (52 / 12);
  const salarioAnual   = salarioMensual * 12;
  const salarioDiario  = salarioHora * (horasSemanales / diasSemanales);

  return { porHora: Number(salarioHora), mensual: salarioMensual, anual: salarioAnual,
           diario: salarioDiario, horasSemanales, diasSemanales, horasPorDia };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(amount) {
  if (amount == null) return "—";
  return `₡${Number(amount).toLocaleString("es-CR", { minimumFractionDigits: 0 })}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-CR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function daysBetween(a, b) {
  return Math.max(0, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

// ─── CÁLCULO AGUINALDO ───────────────────────────────────────────────────────
function calcAguinaldo(salary, startDate, endDate) {
  if (!salary || !startDate) return null;

  const salarioNum  = Number(salary);
  const hoy         = new Date();
  const inicio      = new Date(startDate + "T12:00:00");
  const finContrato = endDate ? new Date(endDate + "T12:00:00") : hoy;
  const finEfectivo = finContrato < hoy ? finContrato : hoy;

  const firstYear = inicio.getMonth() === 11 ? inicio.getFullYear() + 1 : inicio.getFullYear();
  const lastYear  = finEfectivo.getMonth() === 11 ? finEfectivo.getFullYear() + 1 : finEfectivo.getFullYear();

  const periodos = [];
  for (let y = firstYear; y <= lastYear; y++) {
    const periodoInicio = new Date(`${y - 1}-12-01T12:00:00`);
    const periodoFin    = new Date(`${y}-11-30T12:00:00`);
    const efectivoInicio = inicio      > periodoInicio ? inicio      : periodoInicio;
    const efectivoFin    = finEfectivo < periodoFin    ? finEfectivo : periodoFin;
    if (efectivoFin < efectivoInicio) continue;
    const diasPeriodoTotal = daysBetween(periodoInicio, periodoFin) + 1;
    const diasTrabajados   = daysBetween(efectivoInicio, efectivoFin) + 1;
    const proporcion       = Math.min(diasTrabajados / diasPeriodoTotal, 1);
    const monto            = salarioNum * proporcion;
    const meses            = Math.round(proporcion * 12 * 10) / 10;
    const pagado           = periodoFin < hoy;
    periodos.push({ periodoInicio, periodoFin, efectivoInicio, efectivoFin,
                    diasTrabajados, diasPeriodoTotal, proporcion, monto, meses, pagado });
  }

  if (periodos.length === 0) return null;
  const actual = periodos[periodos.length - 1];
  return { periodos, actual };
}

// ─── CÁLCULO VACACIONES ──────────────────────────────────────────────────────
function calcVacaciones(salary, startDate) {
  if (!salary || !startDate) return null;

  const salarioNum        = Number(salary);
  const inicio            = new Date(startDate + "T12:00:00");
  const hoy               = new Date();
  const diasTrabajados    = daysBetween(inicio, hoy);
  const semanasTrabajadas = diasTrabajados / 7;
  const periodosCompletos = Math.floor(semanasTrabajadas / 50);
  const semanasEnPeriodo  = semanasTrabajadas % 50;
  const diasAcumuladosPeriodo = Math.floor((semanasEnPeriodo / 50) * 14);
  const salarioDiario     = (salarioNum * 12) / 365;
  const diasPendientes    = periodosCompletos * 14 + diasAcumuladosPeriodo;
  const montoPendiente    = diasPendientes * salarioDiario;

  return { diasTrabajados, semanasTrabajadas: Math.floor(semanasTrabajadas),
           periodosCompletos, diasAcumuladosPeriodo, diasPendientes,
           salarioDiario, montoPendiente };
}

// ─── CÁLCULO FERIADOS ────────────────────────────────────────────────────────
function calcFeriados(salarioHora, startDate, endDate, schedule) {
  if (!salarioHora || !startDate) return null;

  const inicio = new Date(startDate + "T12:00:00");
  const fin    = endDate ? new Date(endDate + "T12:00:00") : new Date();

  const WEEKDAY_MAP = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 };
  const scheduleMap = {};
  (schedule ?? []).forEach(s => {
    const jsDay = WEEKDAY_MAP[s.week_day?.toLowerCase()];
    if (jsDay == null) return;
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    scheduleMap[jsDay] = (eh + em / 60) - (sh + sm / 60);
  });

  const diasLaborables = new Set(Object.keys(scheduleMap).map(Number));
  if (diasLaborables.size === 0) [1,2,3,4,5].forEach(d => { diasLaborables.add(d); scheduleMap[d] = 8; });

  const horasDiarias = Object.values(scheduleMap).reduce((a,b) => a+b, 0) / (diasLaborables.size || 1);
  const salarioDia   = salarioHora * horasDiarias;

  const feriadosDentroContrato = FERIADOS_CR.filter(f => {
    const fd = new Date(f.date + "T12:00:00");
    return fd >= inicio && fd <= fin && diasLaborables.has(fd.getDay());
  }).map(f => {
    const fd       = new Date(f.date + "T12:00:00");
    const jsDay    = fd.getDay();
    const horasDia = scheduleMap[jsDay] ?? horasDiarias;
    const pagoDia  = salarioHora * horasDia;
    return { ...f,
      diasSemana: fd.toLocaleDateString("es-CR", { weekday: "long" }),
      horasDia, pagoSimple: pagoDia, pagoExtra: pagoDia, pagoTotal: pagoDia * 2,
    };
  });

  const totalPagoExtra = feriadosDentroContrato.reduce((a, f) => a + f.pagoExtra, 0);
  return { feriados: feriadosDentroContrato, salarioDia, totalPagoExtra, horasDiarias };
}

// ─── SUBCOMPONENTES ──────────────────────────────────────────────────────────
const estadoColor = { accepted:"text-green-600", expired:"text-red-500", pending:"text-amber-600", rejected:"text-gray-500" };

function Pill({ children, color = "green" }) {
  const cls = {
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue:  "bg-blue-50  text-blue-700  border-blue-200",
    red:   "bg-red-50   text-red-600   border-red-200",
    gray:  "bg-gray-50  text-gray-500  border-gray-200",
  }[color];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

function SectionCard({ icon: Icon, title, children, accentColor = "#D06224" }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="bg-white rounded-2xl border border-[#E7D5B8] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#FBF5E0]/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor + "18" }}>
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">{title}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#5C3A1E]/40" /> : <ChevronDown className="w-4 h-4 text-[#5C3A1E]/40" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}

function StatBox({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-[#D06224]/8 border border-[#D06224]/20" : "bg-[#FBF5E0]"}`}>
      <p className="text-xs text-[#5C3A1E]/60 mb-1">{label}</p>
      <p className={`font-bold text-lg ${highlight ? "text-[#D06224]" : "text-[#2C1A0E]"}`}>{value}</p>
      {sub && <p className="text-xs text-[#5C3A1E]/50 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Benefits({ contract, onBack }) {
  const { t } = useTranslation();

  if (!contract) return null;

  const salarioHora    = Number(contract.salary ?? contract.job_offer?.salary ?? 0);
  const startDate      = contract.start_date;
  const endDate        = contract.end_date;
  const schedule       = contract.contract_schedule ?? [];
  const status         = contract.status ?? "pending";
  const salaryInfo     = calcSalaryFromHourly(salarioHora, schedule);
  const salarioMensual = salaryInfo?.mensual ?? 0;
  const salarioAnual   = salaryInfo?.anual   ?? 0;
  const aguinaldo      = calcAguinaldo(salarioMensual, startDate, endDate);
  const vacaciones     = calcVacaciones(salarioMensual, startDate);
  const feriados       = calcFeriados(salarioHora, startDate, endDate, schedule);

  const estadoLabel = {
    accepted: t("benefits.status.accepted"),
    expired:  t("benefits.status.expired"),
    pending:  t("benefits.status.pending"),
    rejected: t("benefits.status.rejected"),
  };

  const DAY_LABELS = {
    monday:    t("benefits.schedule.days.monday"),
    tuesday:   t("benefits.schedule.days.tuesday"),
    wednesday: t("benefits.schedule.days.wednesday"),
    thursday:  t("benefits.schedule.days.thursday"),
    friday:    t("benefits.schedule.days.friday"),
    saturday:  t("benefits.schedule.days.saturday"),
    sunday:    t("benefits.schedule.days.sunday"),
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#5C3A1E]/60 hover:text-[#D06224] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("benefits.backButton")}
        </button>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("benefits.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60">
          {contract.job_offer?.title ?? "Contrato"} · {contract.employer_user?.full_name ?? "—"}
        </p>
      </div>

      {/* RESUMEN */}
      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-4">
          {t("benefits.summary.sectionTitle")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("benefits.summary.hourlyRate"),    value: fmt(salarioHora),                    Icon: Clock      },
            { label: t("benefits.summary.monthlySalary"), value: fmt(Math.round(salarioMensual)),     Icon: DollarSign },
            { label: t("benefits.summary.annualSalary"),  value: fmt(Math.round(salarioAnual)),       Icon: TrendingUp },
            { label: t("benefits.summary.status"),        value: estadoLabel[status] ?? status,       Icon: Award, cls: estadoColor[status] },
          ].map(({ label, value, Icon, cls }) => (
            <div key={label} className="rounded-xl bg-[#FBF5E0] p-4">
              <p className="text-xs font-semibold text-[#5C3A1E]/60 mb-1">{label}</p>
              <div className={`flex items-center gap-2 text-sm font-semibold ${cls ?? "text-[#2C1A0E]"}`}>
                <Icon className="w-4 h-4 text-[#D06224]" />
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Desglose del horario */}
        {salaryInfo && (
          <div className="mt-4 bg-[#FBF5E0] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#5C3A1E]/60 uppercase tracking-wider mb-3">
              {t("benefits.schedule.sectionTitle")}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {schedule.map((s, i) => {
                const [sh, sm] = s.start_time.split(":").map(Number);
                const [eh, em] = s.end_time.split(":").map(Number);
                const hrs = (eh + em / 60) - (sh + sm / 60);
                return (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-[#E7D5B8] rounded-lg px-3 py-1.5">
                    <span className="text-xs font-bold text-[#D06224]">
                      {DAY_LABELS[s.week_day?.toLowerCase()] ?? s.week_day}
                    </span>
                    <span className="text-xs text-[#5C3A1E]/60">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                    <span className="text-xs font-semibold text-[#2C1A0E]">({hrs}h)</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-6 text-sm">
              <span className="text-[#5C3A1E]/60">
                {t("benefits.schedule.weeklyHours")}: <span className="font-bold text-[#2C1A0E]">{salaryInfo.horasSemanales}h</span>
              </span>
              <span className="text-[#5C3A1E]/60">
                {t("benefits.schedule.daysPerWeek")}: <span className="font-bold text-[#2C1A0E]">{salaryInfo.diasSemanales}</span>
              </span>
              <span className="text-[#5C3A1E]/60">
                {t("benefits.schedule.formula")}: <span className="font-semibold text-[#2C1A0E]">
                  {t("benefits.schedule.formulaValue", {
                    hourly:  fmt(salarioHora),
                    hours:   salaryInfo.horasSemanales,
                    monthly: fmt(Math.round(salarioMensual)),
                  })}
                </span>
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── AGUINALDO ── */}
      <SectionCard icon={Gift} title={t("benefits.aguinaldo.sectionTitle")} accentColor="#D06224">
        {aguinaldo ? (
          <>
            <div className="space-y-4">
              {aguinaldo.periodos.map((p, i) => (
                <div key={i} className={`rounded-xl border p-4 ${p.pagado ? "border-[#E7D5B8] bg-[#FBF5E0]" : "border-[#D06224]/30 bg-[#D06224]/5"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#5C3A1E]/60 uppercase tracking-wider">
                        {t("benefits.aguinaldo.period", {
                          start: p.periodoInicio.getFullYear(),
                          end:   p.periodoFin.getFullYear(),
                        })}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.pagado ? "bg-green-100 text-green-700" : "bg-[#D06224]/15 text-[#D06224]"}`}>
                        {p.pagado
                          ? t("benefits.aguinaldo.paid", { year: p.periodoFin.getFullYear() })
                          : t("benefits.aguinaldo.inProgress")}
                      </span>
                    </div>
                    <span className="font-bold text-lg text-[#2C1A0E]">{fmt(Math.round(p.monto))}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-[#5C3A1E]/60 mb-1">
                      <span>{t("benefits.aguinaldo.progressStart", { year: p.periodoInicio.getFullYear() })}</span>
                      <span className={`font-semibold ${p.pagado ? "text-green-600" : "text-[#D06224]"}`}>
                        {t("benefits.aguinaldo.progressPercent", { percent: Math.round(p.proporcion * 100) })}
                      </span>
                      <span>{t("benefits.aguinaldo.progressEnd", { year: p.periodoFin.getFullYear() })}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E7D5B8] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.pagado ? "bg-green-500" : "bg-[#D06224]"}`}
                        style={{ width: `${Math.min(100, p.proporcion * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-white rounded-lg p-2 border border-[#E7D5B8]">
                      <p className="text-[#5C3A1E]/50 mb-0.5">{t("benefits.aguinaldo.activeDays")}</p>
                      <p className="font-bold text-[#2C1A0E]">{p.diasTrabajados} / {p.diasPeriodoTotal}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-[#E7D5B8]">
                      <p className="text-[#5C3A1E]/50 mb-0.5">{t("benefits.aguinaldo.accumulatedMonths")}</p>
                      <p className="font-bold text-[#2C1A0E]">{t("benefits.aguinaldo.months", { count: p.meses })}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-[#E7D5B8]">
                      <p className="text-[#5C3A1E]/50 mb-0.5">{t("benefits.aguinaldo.activeStart")}</p>
                      <p className="font-bold text-[#2C1A0E]">
                        {p.efectivoInicio.toLocaleDateString("es-CR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {aguinaldo.periodos.length > 1 && (
              <div className="mt-3 flex items-center justify-between bg-[#2C1A0E] rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-white/70">{t("benefits.aguinaldo.totalBothPeriods")}</span>
                <span className="font-bold text-lg text-white">
                  {fmt(Math.round(aguinaldo.periodos.reduce((a, p) => a + p.monto, 0)))}
                </span>
              </div>
            )}

            <div className="mt-4 bg-[#FBF5E0] rounded-xl p-4 text-sm text-[#5C3A1E]/70">
              <p className="font-semibold text-[#2C1A0E] mb-1">{t("benefits.aguinaldo.howTitle")}</p>
              <p>{t("benefits.aguinaldo.howDescription")}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5C3A1E]/60 py-2">{t("benefits.aguinaldo.noData")}</p>
        )}
      </SectionCard>

      {/* ── VACACIONES ── */}
      <SectionCard icon={Umbrella} title={t("benefits.vacations.sectionTitle")} accentColor="#2E7D32">
        {vacaciones ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <StatBox label={t("benefits.vacations.accumulatedDays")}  value={t("benefits.vacations.days",  { count: vacaciones.diasPendientes })}        highlight />
              <StatBox label={t("benefits.vacations.completePeriods")}  value={t("benefits.vacations.years", { count: vacaciones.periodosCompletos })} />
              <StatBox label={t("benefits.vacations.workedWeeks")}      value={t("benefits.vacations.weeks", { count: vacaciones.semanasTrabajadas })} />
              <StatBox label={t("benefits.vacations.moneyValue")}       value={fmt(Math.round(vacaciones.montoPendiente))} />
            </div>

            {vacaciones.periodosCompletos > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {Array.from({ length: vacaciones.periodosCompletos }).map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg px-3 py-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      {t("benefits.vacations.completePeriodLabel", { number: i + 1 })}
                    </span>
                  </div>
                ))}
                {vacaciones.diasAcumuladosPeriodo > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#FFF8E1] border border-[#FFE082] rounded-lg px-3 py-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">
                      {t("benefits.vacations.inProgressLabel", { count: vacaciones.diasAcumuladosPeriodo })}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#FBF5E0] rounded-xl p-4 text-sm text-[#5C3A1E]/70">
              <p className="font-semibold text-[#2C1A0E] mb-1">{t("benefits.vacations.howTitle")}</p>
              <p>{t("benefits.vacations.howDescription")}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5C3A1E]/60 py-2">{t("benefits.vacations.noData")}</p>
        )}
      </SectionCard>

      {/* ── DÍAS FERIADOS ── */}
      <SectionCard icon={Star} title={t("benefits.holidays.sectionTitle")} accentColor="#1565C0">
        {feriados ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <StatBox label={t("benefits.holidays.contractHolidays")} value={t("benefits.holidays.days", { count: feriados.feriados.length })} highlight />
              <StatBox label={t("benefits.holidays.dailySalary")}      value={fmt(Math.round(feriados.salarioDia))} />
              <StatBox label={t("benefits.holidays.extraPay")}         value={fmt(Math.round(feriados.totalPagoExtra))} />
            </div>

            {feriados.feriados.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#5C3A1E]/50 uppercase tracking-wider mb-2">
                  {t("benefits.holidays.listTitle")}
                </p>
                {feriados.feriados.map(f => (
                  <div
                    key={f.date}
                    className="flex items-center justify-between bg-[#FBF5E0] rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white border border-[#E7D5B8] flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] font-bold text-[#D06224] leading-none uppercase">
                          {new Date(f.date + "T12:00:00").toLocaleDateString("es-CR", { month: "short" })}
                        </span>
                        <span className="text-sm font-bold text-[#2C1A0E] leading-none">
                          {new Date(f.date + "T12:00:00").getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-[#2C1A0E] text-sm">{f.name}</p>
                        <p className="text-xs text-[#5C3A1E]/60 capitalize">{f.diasSemana}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-xs text-[#5C3A1E]/50">{t("benefits.holidays.doublePayLabel")}</p>
                        <p className="font-bold text-[#2C1A0E] text-sm">{fmt(Math.round(f.pagoTotal))}</p>
                      </div>
                      <Pill color={f.obligatorio ? "red" : "amber"}>
                        {f.obligatorio ? t("benefits.holidays.mandatory") : t("benefits.holidays.notMandatory")}
                      </Pill>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5C3A1E]/60 py-2 text-center">
                {t("benefits.holidays.noHolidays")}
              </p>
            )}

            <div className="mt-4 bg-[#FBF5E0] rounded-xl p-4 text-sm text-[#5C3A1E]/70">
              <p className="font-semibold text-[#2C1A0E] mb-1">{t("benefits.holidays.howTitle")}</p>
              <p>{t("benefits.holidays.howDescription")}</p>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#5C3A1E]/60 py-2">{t("benefits.holidays.noData")}</p>
        )}
      </SectionCard>

      {/* HISTORIAL PAGOS */}
      {(contract.payments ?? []).length > 0 && (
        <SectionCard icon={DollarSign} title={t("benefits.payments.sectionTitle")} accentColor="#5C3A1E">
          <div className="space-y-2">
            {(contract.payments ?? []).map((p, i) => {
              const label  = p.period_label ?? fmtDate(p.paid_at ?? p.created_at);
              const isPaid = p.status === "paid" || !!p.paid_at;
              return (
                <div key={p.id ?? i} className="flex items-center justify-between bg-[#FBF5E0] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E7D5B8] flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#D06224]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#2C1A0E] text-sm">{label}</p>
                      <p className="text-xs text-[#5C3A1E]/60">{t("benefits.payments.monthlySalaryLabel")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#2C1A0E]">{fmt(p.amount)}</span>
                    {isPaid && (
                      <Pill color="green">
                        <CheckCircle className="w-3 h-3" /> {t("benefits.payments.paid")}
                      </Pill>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}