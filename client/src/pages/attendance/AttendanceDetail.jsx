import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import {
  Clock3, CheckCircle2, AlertTriangle,
  ArrowLeft, ArrowRight, ChevronLeft, FileText,
  CheckCheck, XCircle, MessageSquare,
} from "lucide-react";
import AttendanceRecordsTable from "./AttendanceRecordsTable";

const statusColor = {
  "Puntual":                "#3F7D58",
  "Tardía":                 "#B8860B",
  "Salida Anticipada":      "#B8860B",
  "Ausencia":               "#E52929",
  "Asistencia Justificada": "#3F7D58",
  "Marcas Irregulares":     "#E52929",
};

const statusBgColor = {
  "Puntual":                "#3F7D58",
  "Tardía":                 "#F5C842",
  "Salida Anticipada":      "#F5C842",
  "Ausencia":               "#E52929",
  "Asistencia Justificada": "#3F7D58",
  "Marcas Irregulares":     "#E52929",
};

const JS_DAY_TO_DB = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

// Extrae "HH:MM" del timestamp sin hacer ninguna conversión de zona horaria.
// Funciona tanto con "2026-05-05T07:02:00" como con "2026-05-05T07:02:00Z" o con espacio.
const extractTime = (ts) => {
  if (!ts) return null;
  const normalized = ts.replace(" ", "T").replace("Z", "");
  return normalized.slice(11, 16); // "HH:MM"
};

export default function AttendanceDetail({ contract, onBack }) {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [justification, setJustification] = useState("");
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [savingJustify, setSavingJustify] = useState(false);
  const [showRecordsTable, setShowRecordsTable] = useState(false);

  const monthNames = t("attendanceDetail.months", { returnObjects: true });
  const weekDays   = t("attendanceDetail.weekdays", { returnObjects: true });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const workDayNames = contract.contract_schedule.map(s => s.week_day);

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    const data = await api.get(
      `/api/attendance/${contract.id}/${year}/${month + 1}`,
      token
    );
    if (!data.error) setAttendanceData(data.attendance || []);
    setLoadingAttendance(false);
  };

  useEffect(() => { fetchAttendance(); }, [month, year]);

  const getAttendanceForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceData.find(a => a.work_date.startsWith(dateStr)) || null;
  };

  const isWorkDay = (day) => {
    const date = new Date(year, month, day);
    return workDayNames.includes(JS_DAY_TO_DB[date.getDay()]);
  };

  const todayRecord    = getAttendanceForDay(today.getDate());
  const todayIsWorkDay = isWorkDay(today.getDate());

  const stats = [
    {
      title: t("attendanceDetail.stats.attendances"),
      value: attendanceData.filter(a => ["Puntual", "Asistencia Justificada"].includes(a.status)).length,
      color: "#3F7D58", bg: "#3F7D5815", icon: CheckCircle2,
    },
    {
      title: t("attendanceDetail.stats.tardiness"),
      value: attendanceData.filter(a => ["Tardía", "Salida Anticipada"].includes(a.status)).length,
      color: "#B8860B", bg: "#F5C84215", icon: Clock3,
    },
    {
      title: t("attendanceDetail.stats.absences"),
      value: attendanceData.filter(a => ["Ausencia", "Marcas Irregulares"].includes(a.status)).length,
      color: "#E52929", bg: "#E5292915", icon: AlertTriangle,
    },
    {
      title: t("attendanceDetail.stats.view_records"),
      color: "#D06224", bg: "#D0622415", icon: FileText,
      onClick: () => setShowRecordsTable(true),
    },
  ];

  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear  = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0)  { newMonth = 11; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(1);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const localTimeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const data = await api.post("/api/attendance/check-in", { contractId: contract.id, localDateStr, localTimeStr }, token);
    if (!data.error) await fetchAttendance();
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const localTimeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const data = await api.post("/api/attendance/check-out", { contractId: contract.id, localDateStr, localTimeStr }, token);
    if (!data.error) await fetchAttendance();
    setCheckingOut(false);
  };

  const handleJustify = async () => {
    const record = getAttendanceForDay(selectedDay);
    if (!record) return;
    setSavingJustify(true);
    const data = await api.patch(`/api/attendance/${record.id}/justify`, { justification }, token);
    if (!data.error) {
      await fetchAttendance();
      setShowJustifyModal(false);
      setJustification("");
    }
    setSavingJustify(false);
  };

  const selectedRecord    = getAttendanceForDay(selectedDay);
  const selectedIsWorkDay = isWorkDay(selectedDay);

  // Muestra la hora extraída directamente del string, sin conversión de zona
  const formatTime = (ts) => {
    if (!ts) return "—";
    const locale = i18n.language === "fr" ? "fr-FR" : i18n.language === "en" ? "en-US" : "es-CR";
    const timePart = extractTime(ts);
    if (!timePart) return "—";
    const [h, m] = timePart.split(":").map(Number);
    const d = new Date(2000, 0, 1, h, m);
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const scheduleText = contract.contract_schedule
    .map(s => `${s.week_day.slice(0, 3)} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`)
    .join(" · ");

  const canJustify = selectedRecord &&
    ["Ausencia", "Tardía", "Salida Anticipada", "Marcas Irregulares"].includes(selectedRecord.status) &&
    !selectedRecord.justification;

  const getDayBg = (day, record, workDay) => {
    if (selectedDay === day && workDay) return "#2C1A0E";
    if (!workDay) return "transparent";
    if (!record?.status) return "#FBF5E0";
    if (record.approved === true) return "#3F7D58";
    if (record.approved === false) return "#E52929";
    return statusBgColor[record.status] || "#FBF5E0";
  };

  const getDayColor = (day, record, workDay) => {
    if (selectedDay === day && workDay) return "#FFFFFF";
    if (!workDay) return "rgba(92,58,30,0.3)";
    if (!record?.status) return "#2C1A0E";
    if (record.approved === true) return "#FFFFFF";
    if (record.approved === false) return "#FFFFFF";
    return "#FFFFFF";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            {onBack && (
              <button onClick={onBack} className="w-8 h-8 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#2C1A0E]" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
              {contract.title}
            </h1>
          </div>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">{scheduleText}</p>
        </div>
        <div className="flex gap-3">
          {todayIsWorkDay && !todayRecord?.check_in && (
            <button onClick={handleCheckIn} disabled={checkingIn}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#3F7D58", boxShadow: "0 4px 12px rgba(63,125,88,0.25)" }}>
              {checkingIn ? t("attendanceDetail.checking") : t("attendanceDetail.check_in")}
            </button>
          )}
          {todayIsWorkDay && todayRecord?.check_in && !todayRecord?.check_out && (
            <button onClick={handleCheckOut} disabled={checkingOut}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
              {checkingOut ? t("attendanceDetail.checking") : t("attendanceDetail.check_out")}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} onClick={item.onClick}
              className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:scale-[1.02]"
              style={{
                boxShadow: "0 2px 12px rgba(208,98,36,0.08)",
                border: "2px solid #FBF5E0",
                cursor: item.onClick ? "pointer" : "default",
              }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: item.bg }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>{item.value}</h2>
              <p className="text-xs text-[#5C3A1E]/60 mt-1">{item.title}</p>
            </div>
          );
        })}
      </div>

      {/* Calendario + Panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#2C1A0E]" />
            </button>
            <h2 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
              {monthNames[month]} {year}
            </h2>
            <button onClick={() => changeMonth(1)} className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
              <ArrowRight className="w-5 h-5 text-[#2C1A0E]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-[#5C3A1E]/50 py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day    = i + 1;
              const record  = getAttendanceForDay(day);
              const workDay = isWorkDay(day);
              return (
                <button key={day} onClick={() => workDay && setSelectedDay(day)} disabled={!workDay}
                  className="h-12 rounded-xl text-sm font-semibold transition-all duration-200 relative"
                  style={{
                    backgroundColor: getDayBg(day, record, workDay),
                    color: getDayColor(day, record, workDay),
                    transform: selectedDay === day && workDay ? "scale(1.05)" : "scale(1)",
                    boxShadow: selectedDay === day && workDay ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                    cursor: workDay ? "pointer" : "default",
                  }}>
                  {day}
                  {record?.approved === true && (
                    <span className="absolute top-0.5 right-0.5">
                      <CheckCheck className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  {record?.approved === false && (
                    <span className="absolute top-0.5 right-0.5">
                      <XCircle className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[#D0622210]">
            {[
              { label: t("attendanceDetail.legend.on_time"), color: "#3F7D58" },
              { label: t("attendanceDetail.legend.late"),    color: "#F5C842" },
              { label: t("attendanceDetail.legend.absent"),  color: "#E52929" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-[#5C3A1E]/60">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <CheckCheck className="w-3 h-3 text-[#3F7D58]" />
              <span className="text-xs text-[#5C3A1E]/60">Aprobada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3 h-3 text-[#E52929]" />
              <span className="text-xs text-[#5C3A1E]/60">Rechazada</span>
            </div>
          </div>
        </div>

        {/* Panel del día */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
          <h2 className="text-xl font-bold text-[#2C1A0E] mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("attendanceDetail.day_panel.title", { day: selectedDay })}
          </h2>
          {!selectedIsWorkDay ? (
            <p className="text-sm text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.not_workday")}</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
                <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.check_in")}</p>
                <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">{formatTime(selectedRecord?.check_in)}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
                <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.check_out")}</p>
                <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">{formatTime(selectedRecord?.check_out)}</p>
              </div>
              {selectedRecord?.status && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${statusColor[selectedRecord.status]}20` }}>
                  <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.status")}</p>
                  <p className="text-base font-bold mt-0.5" style={{ color: statusColor[selectedRecord.status] }}>
                    {t(`attendanceDetail.status.${selectedRecord.status}`)}
                  </p>
                </div>
              )}

              {selectedRecord?.approved === true && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "#3F7D5815", border: "1px solid #3F7D5830" }}>
                  <CheckCheck className="w-4 h-4 text-[#3F7D58] flex-shrink-0" />
                  <p className="text-sm font-semibold text-[#3F7D58]">Asistencia aprobada por tu empleador</p>
                </div>
              )}

              {selectedRecord?.approved === false && selectedRecord?.rejection_reason && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#E5292912", border: "1px solid #E5292930" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <XCircle className="w-4 h-4 text-[#E52929] flex-shrink-0" />
                    <p className="text-xs font-semibold text-[#E52929]">Rechazada por tu empleador</p>
                  </div>
                  <p className="text-sm text-[#2C1A0E]">{selectedRecord.rejection_reason}</p>
                </div>
              )}

              {selectedRecord?.observation && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D0622210", border: "1px solid #D0622430" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-4 h-4 text-[#D06224] flex-shrink-0" />
                    <p className="text-xs font-semibold text-[#D06224]">Observación del empleador</p>
                  </div>
                  <p className="text-sm text-[#2C1A0E]">{selectedRecord.observation}</p>
                </div>
              )}
              {selectedRecord?.justification && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#8A863515" }}>
                  <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.justification")}</p>
                  <p className="text-sm text-[#2C1A0E] mt-0.5">{selectedRecord.justification}</p>
                </div>
              )}
              {canJustify && (
                <button onClick={() => setShowJustifyModal(true)}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-2 transition-all hover:opacity-90"
                  style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
                  {t("attendanceDetail.day_panel.add_justify")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal justificación */}
      {showJustifyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 className="text-xl font-bold text-[#2C1A0E] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              {t("attendanceDetail.justify_modal.title")}
            </h3>
            <textarea value={justification} onChange={e => setJustification(e.target.value)}
              placeholder={t("attendanceDetail.justify_modal.placeholder")} rows={4}
              className="w-full rounded-xl border border-[#D0622230] p-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#D06224]" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowJustifyModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] bg-[#FBF5E0] hover:bg-[#D06224]/10 transition-colors">
                {t("attendanceDetail.justify_modal.cancel")}
              </button>
              <button onClick={handleJustify} disabled={savingJustify || !justification.trim()}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all hover:opacity-90"
                style={{ backgroundColor: "#D06224" }}>
                {savingJustify ? t("attendanceDetail.justify_modal.saving") : t("attendanceDetail.justify_modal.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de registros */}
      {showRecordsTable && (
        <AttendanceRecordsTable
          records={attendanceData}
          onClose={() => setShowRecordsTable(false)}
        />
      )}
    </div>
  );
}