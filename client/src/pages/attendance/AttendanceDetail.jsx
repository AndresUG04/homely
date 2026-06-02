import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import {
  Clock3, CheckCircle2, AlertTriangle,
  ArrowLeft, ArrowRight, ChevronLeft, FileText,
  CheckCheck, XCircle, MessageSquare, Paperclip, X,
} from "lucide-react";
import AttendanceRecordsTable from "./AttendanceRecordsTable";

const statusColor = {
  "Puntual":                "#1A6B3C",
  "Tardía":                 "#92650A",
  "Salida Anticipada":      "#92650A",
  "Ausencia":               "#C0152A",
  "Asistencia Justificada": "#1A6B3C",
  "Marcas Irregulares":     "#C0152A",
};

const statusBgColor = {
  "Puntual":                "#22A05B",
  "Tardía":                 "#E8A800",
  "Salida Anticipada":      "#E8A800",
  "Ausencia":               "#E52929",
  "Asistencia Justificada": "#22A05B",
  "Marcas Irregulares":     "#E52929",
};

const BORDER_APPROVED  = "#00D084";
const BORDER_REJECTED  = "#9CA3AF";
const BG_REJECTED_FULL = "#6B7280";

const JS_DAY_TO_DB = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

const extractTime = (ts) => {
  if (!ts) return null;
  const normalized = ts.replace(" ", "T").replace("Z", "");
  return normalized.slice(11, 16);
};

export default function AttendanceDetail({ contract, onBack }) {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const today = new Date();

  const [month, setMonth]                   = useState(today.getMonth());
  const [year, setYear]                     = useState(today.getFullYear());
  const [selectedDay, setSelectedDay]       = useState(today.getDate());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [checkingIn, setCheckingIn]         = useState(false);
  const [checkingOut, setCheckingOut]       = useState(false);
  const [showRecordsTable, setShowRecordsTable] = useState(false);

  // ─── Mensaje de confirmación ──────────────────────────────────────────────
  const [msg, setMsg] = useState("");

  const notify = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  // ─── Estado justificación ─────────────────────────────────────────────────
  const [justification, setJustification]       = useState("");
  const [justifyFile, setJustifyFile]           = useState(null);
  const [showJustifyModal, setShowJustifyModal] = useState(false);
  const [savingJustify, setSavingJustify]       = useState(false);
  const fileInputRef = useRef(null);

  // ─── Estado nota general ──────────────────────────────────────────────────
  const [note, setNote]                     = useState("");
  const [noteFile, setNoteFile]             = useState(null);
  const [showNoteModal, setShowNoteModal]   = useState(false);
  const [savingNote, setSavingNote]         = useState(false);
  const noteFileInputRef                    = useRef(null);

  const monthNames  = t("attendanceDetail.months",   { returnObjects: true });
  const weekDays    = t("attendanceDetail.weekdays", { returnObjects: true });

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDay     = new Date(year, month, 1).getDay();
  const workDayNames = contract.contract_schedule.map((s) => s.week_day);

  const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();

  // ─── Fetch ────────────────────────────────────────────────────────────────
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

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getAttendanceForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceData.find((a) => a.work_date.startsWith(dateStr)) || null;
  };

  const isWorkDay = (day) => {
    const date = new Date(year, month, day);
    return workDayNames.includes(JS_DAY_TO_DB[date.getDay()]);
  };

  const todayRecord    = getAttendanceForDay(today.getDate());
  const todayIsWorkDay = isWorkDay(today.getDate());

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
    .map((s) => `${s.week_day.slice(0, 3)} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`)
    .join(" · ");

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = [
    {
      title: t("attendanceDetail.stats.attendances"),
      value: attendanceData.filter((a) => ["Puntual", "Asistencia Justificada"].includes(a.status)).length,
      color: "#1A6B3C", bg: "#22A05B18", icon: CheckCircle2,
    },
    {
      title: t("attendanceDetail.stats.tardiness"),
      value: attendanceData.filter((a) => ["Tardía", "Salida Anticipada"].includes(a.status)).length,
      color: "#92650A", bg: "#E8A80018", icon: Clock3,
    },
    {
      title: t("attendanceDetail.stats.absences"),
      value: attendanceData.filter((a) => ["Ausencia", "Marcas Irregulares"].includes(a.status)).length,
      color: "#C0152A", bg: "#E5292918", icon: AlertTriangle,
    },
    {
      title: t("attendanceDetail.stats.view_records"),
      color: "#D06224", bg: "#D0622415", icon: FileText,
      onClick: () => setShowRecordsTable(true),
    },
  ];

  // ─── Cambio de mes ────────────────────────────────────────────────────────
  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear  = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0)  { newMonth = 11; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(1);
  };

  // ─── Check in / out ───────────────────────────────────────────────────────
  const handleCheckIn = async () => {
    setCheckingIn(true);
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const localTimeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const data = await api.post("/api/attendance/check-in", { contractId: contract.id, localDateStr, localTimeStr }, token);
    if (!data.error) {
      await fetchAttendance();
      notify(t("attendanceDetail.notify.check_in", { time: localTimeStr }));
    }
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    const now = new Date();
    const localDateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const localTimeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const data = await api.post("/api/attendance/check-out", { contractId: contract.id, localDateStr, localTimeStr }, token);
    if (!data.error) {
      await fetchAttendance();
      notify(t("attendanceDetail.notify.check_out", { time: localTimeStr }));
    }
    setCheckingOut(false);
  };

  // ─── Justificación ────────────────────────────────────────────────────────
  const handleJustify = async () => {
    const record = getAttendanceForDay(selectedDay);
    if (!record) return;
    setSavingJustify(true);

    let justificationText = justification;

    if (justifyFile) {
      const formData = new FormData();
      formData.append("file", justifyFile);
      formData.append("attendanceId", record.id);
      try {
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/upload-justification`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          justificationText = justification
            ? `${justification}\n[Adjunto]: ${uploadData.url}`
            : `[Adjunto]: ${uploadData.url}`;
        }
      } catch (err) {
        console.error("Error subiendo archivo:", err);
      }
    }

    const data = await api.patch(`/api/attendance/${record.id}/justify`, { justification: justificationText }, token);
    if (!data.error) {
      await fetchAttendance();
      setShowJustifyModal(false);
      setJustification("");
      setJustifyFile(null);
      notify(t("attendanceDetail.notify.justify_sent"));
    }
    setSavingJustify(false);
  };

  const handleJustifyFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notify(t("attendanceDetail.notify.file_too_large")); return; }
    setJustifyFile(file);
  };

  const removeJustifyFile = () => {
    setJustifyFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── Nota general ─────────────────────────────────────────────────────────
  const handleSaveNote = async () => {
    setSavingNote(true);
    const record = getAttendanceForDay(selectedDay);
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

    let noteText = note;

    if (noteFile && record) {
      const formData = new FormData();
      formData.append("file", noteFile);
      formData.append("attendanceId", record.id);
      try {
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/upload-justification`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          noteText = note
            ? `${note}\n[Adjunto]: ${uploadData.url}`
            : `[Adjunto]: ${uploadData.url}`;
        }
      } catch (err) {
        console.error("Error subiendo archivo:", err);
      }
    }

    let data;
    if (record) {
      data = await api.patch(`/api/attendance/${record.id}/note`, { note: noteText }, token);
    } else {
      data = await api.post(`/api/attendance/note`, {
        contractId: contract.id,
        date: dateStr,
        note: noteText,
      }, token);
    }

    if (!data.error) {
      if (noteFile && !record && data.attendance?.id) {
        const formData = new FormData();
        formData.append("file", noteFile);
        formData.append("attendanceId", data.attendance.id);
        try {
          const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/api/attendance/upload-justification`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            const finalNote = note
              ? `${note}\n[Adjunto]: ${uploadData.url}`
              : `[Adjunto]: ${uploadData.url}`;
            await api.patch(`/api/attendance/${data.attendance.id}/note`, { note: finalNote }, token);
          }
        } catch (err) {
          console.error("Error subiendo archivo:", err);
        }
      }

      await fetchAttendance();
      setShowNoteModal(false);
      setNote("");
      setNoteFile(null);
      notify(t("attendanceDetail.notify.note_saved"));
    }
    setSavingNote(false);
  };

  const handleNoteFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notify(t("attendanceDetail.notify.file_too_large")); return; }
    setNoteFile(file);
  };

  const removeNoteFile = () => {
    setNoteFile(null);
    if (noteFileInputRef.current) noteFileInputRef.current.value = "";
  };

  // ─── Colores del calendario ───────────────────────────────────────────────
  const getDayBg = (day, record, workDay) => {
    if (selectedDay === day && workDay) return "#2C1A0E";
    if (!workDay) return "transparent";
    if (!record?.status) return "#FBF5E0";
    if (record.approved === false && record.rejection_reason) return BG_REJECTED_FULL;
    return statusBgColor[record.status] || "#FBF5E0";
  };

  const getDayColor = (day, record, workDay) => {
    if (selectedDay === day && workDay) return "#FFFFFF";
    if (!workDay) return "rgba(92,58,30,0.3)";
    if (!record?.status) return "#2C1A0E";
    return "#FFFFFF";
  };

  const getDayBorder = (day, record, workDay) => {
    if (!workDay || !record || selectedDay === day) return "2px solid transparent";
    if (record.approved === true)  return `3px solid ${BORDER_APPROVED}`;
    if (record.approved === false && record.rejection_reason) return `3px solid ${BORDER_REJECTED}`;
    return "2px solid transparent";
  };

  const selectedRecord    = getAttendanceForDay(selectedDay);
  const selectedIsWorkDay = isWorkDay(selectedDay);

  const canJustify = selectedRecord &&
    ["Ausencia", "Tardía", "Salida Anticipada", "Marcas Irregulares"].includes(selectedRecord.status) &&
    !selectedRecord.justification;

  const canAddNote = selectedIsWorkDay && !selectedRecord?.note;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
            {onBack && (
              <button onClick={onBack}
                className="w-8 h-8 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
                <ChevronLeft className="w-5 h-5 text-[#2C1A0E]" />
              </button>
            )}
            <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
              {contract.title}
            </h1>
          </div>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">{scheduleText}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mensaje de confirmación */}
          {msg && (
            <p className="text-sm font-semibold text-[#1A6B3C]">{msg}</p>
          )}

          {isCurrentMonth && todayIsWorkDay && !todayRecord?.check_in && (
            <button onClick={handleCheckIn} disabled={checkingIn}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#22A05B", boxShadow: "0 4px 12px rgba(34,160,91,0.30)" }}>
              {checkingIn ? t("attendanceDetail.checking") : t("attendanceDetail.check_in")}
            </button>
          )}
          {isCurrentMonth && todayIsWorkDay && todayRecord?.check_in && !todayRecord?.check_out && (
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
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: item.bg }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h2 className="text-3xl font-bold text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}>{item.value ?? ""}</h2>
              <p className="text-xs text-[#5C3A1E]/60 mt-1">{item.title}</p>
            </div>
          );
        })}
      </div>

      {/* Calendario + Panel */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Calendario */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>

          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-[#2C1A0E]" />
            </button>
            <h2 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
              {monthNames[month]} {year}
            </h2>
            <button onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
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
              const day     = i + 1;
              const record  = getAttendanceForDay(day);
              const workDay = isWorkDay(day);
              return (
                <button key={day}
                  onClick={() => workDay && setSelectedDay(day)}
                  disabled={!workDay}
                  className="h-12 rounded-xl text-sm font-semibold transition-all duration-200 relative"
                  style={{
                    backgroundColor: getDayBg(day, record, workDay),
                    color:           getDayColor(day, record, workDay),
                    border:          getDayBorder(day, record, workDay),
                    transform:       selectedDay === day && workDay ? "scale(1.05)" : "scale(1)",
                    boxShadow:       selectedDay === day && workDay ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                    cursor:          workDay ? "pointer" : "default",
                  }}>
                  {day}
                  {record?.approved === true && (
                    <span className="absolute top-0.5 right-0.5">
                      <CheckCheck className="w-2.5 h-2.5" style={{ color: BORDER_APPROVED }} />
                    </span>
                  )}
                  {record?.approved === false && record?.rejection_reason && (
                    <span className="absolute top-0.5 right-0.5">
                      <XCircle className="w-2.5 h-2.5" style={{ color: BORDER_REJECTED }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[#D0622210]">
            {[
              { label: t("attendanceDetail.legend.on_time"), color: "#22A05B" },
              { label: t("attendanceDetail.legend.late"),    color: "#E8A800" },
              { label: t("attendanceDetail.legend.absent"),  color: "#E52929" },
              { label: t("attendanceDetail.legend.rejected"), color: BG_REJECTED_FULL },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-[#5C3A1E]/60">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: BORDER_APPROVED }} />
              <span className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.legend.approved")}</span>
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

              {/* Entrada */}
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
                <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.check_in")}</p>
                <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">{formatTime(selectedRecord?.check_in)}</p>
              </div>

              {/* Salida */}
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
                <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.check_out")}</p>
                <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">{formatTime(selectedRecord?.check_out)}</p>
              </div>

              {/* Status */}
              {selectedRecord?.status && (
                <div className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: `${statusColor[selectedRecord.status]}18` }}>
                  <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.status")}</p>
                  <p className="text-base font-bold mt-0.5" style={{ color: statusColor[selectedRecord.status] }}>
                    {t(`attendanceDetail.status.${selectedRecord.status}`)}
                  </p>
                </div>
              )}

              {/* Aprobada */}
              {selectedRecord?.approved === true && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                  style={{ backgroundColor: "#00D08415", border: `1px solid ${BORDER_APPROVED}40` }}>
                  <CheckCheck className="w-4 h-4 flex-shrink-0" style={{ color: BORDER_APPROVED }} />
                  <p className="text-sm font-semibold" style={{ color: "#009960" }}>
                    {t("attendanceDetail.records_table.approved")}
                  </p>
                </div>
              )}

              {/* Rechazada */}
              {selectedRecord?.approved === false && selectedRecord?.rejection_reason && (
                <div className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "#6B728012", border: `1px solid ${BORDER_REJECTED}60` }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: BG_REJECTED_FULL }} />
                    <p className="text-xs font-semibold" style={{ color: BG_REJECTED_FULL }}>
                      {t("attendanceDetail.records_table.rejection_reason")}
                    </p>
                  </div>
                  <p className="text-sm text-[#2C1A0E]">{selectedRecord.rejection_reason}</p>
                </div>
              )}

              {/* Observación del admin */}
              {selectedRecord?.observation && (
                <div className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "#D0622210", border: "1px solid #D0622430" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="w-4 h-4 text-[#D06224] flex-shrink-0" />
                    <p className="text-xs font-semibold text-[#D06224]">{t("attendanceDetail.records_table.observation")}</p>
                  </div>
                  <p className="text-sm text-[#2C1A0E]">{selectedRecord.observation}</p>
                </div>
              )}

              {/* Justificación enviada */}
              {selectedRecord?.justification && (() => {
                const raw    = selectedRecord.justification;
                const adjIdx = raw.indexOf("[Adjunto]:");
                const text   = adjIdx === -1 ? raw.trim() : raw.slice(0, adjIdx).trim();
                const url    = adjIdx !== -1 ? raw.slice(adjIdx + "[Adjunto]:".length).trim() : null;
                return (
                  <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#8A863515" }}>
                    <p className="text-xs text-[#5C3A1E]/60 mb-0.5">
                      {t("attendanceDetail.day_panel.justification")}
                    </p>
                    {text && <p className="text-sm text-[#2C1A0E]">{text}</p>}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-[#D06224] underline">
                        <Paperclip className="w-3 h-3" />
                        {t("attendanceDetail.records_table.justification_attachment")}
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Nota general guardada */}
              {selectedRecord?.note && (() => {
                const raw    = selectedRecord.note;
                const adjIdx = raw.indexOf("[Adjunto]:");
                const text   = adjIdx === -1 ? raw.trim() : raw.slice(0, adjIdx).trim();
                const url    = adjIdx !== -1 ? raw.slice(adjIdx + "[Adjunto]:".length).trim() : null;
                return (
                  <div className="rounded-xl px-4 py-3"
                    style={{ backgroundColor: "#1A6B3C12", border: "1px solid #1A6B3C25" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" style={{ color: "#1A6B3C" }} />
                      <p className="text-xs font-semibold" style={{ color: "#1A6B3C" }}>
                        {t("attendanceDetail.day_panel.note")}
                      </p>
                    </div>
                    {text && <p className="text-sm text-[#2C1A0E]">{text}</p>}
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-[#1A6B3C] underline">
                        <Paperclip className="w-3 h-3" />
                        {t("attendanceDetail.records_table.justification_attachment")}
                      </a>
                    )}
                  </div>
                );
              })()}

              {/* Botón agregar justificación */}
              {canJustify && (
                <button onClick={() => setShowJustifyModal(true)}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-2 transition-all hover:opacity-90"
                  style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
                  {t("attendanceDetail.day_panel.add_justify")}
                </button>
              )}

              {/* Botón agregar nota general */}
              {canAddNote && (
                <button onClick={() => setShowNoteModal(true)}
                  className="w-full py-3 rounded-xl text-sm font-semibold mt-2 transition-all hover:opacity-90"
                  style={{
                    backgroundColor: "#FBF5E0",
                    color: "#1A6B3C",
                    border: "1.5px solid #1A6B3C35",
                  }}>
                  {t("attendanceDetail.day_panel.add_note")}
                </button>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ─── Modal justificación ─────────────────────────────────────────────── */}
      {showJustifyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                {t("attendanceDetail.justify_modal.title")}
              </h3>
              <button onClick={() => { setShowJustifyModal(false); setJustifyFile(null); setJustification(""); }}
                className="w-8 h-8 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
                <X className="w-4 h-4 text-[#2C1A0E]" />
              </button>
            </div>

            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={t("attendanceDetail.justify_modal.placeholder")}
              rows={4}
              className="w-full rounded-xl border border-[#D0622230] p-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#D06224]"
            />

            <div className="mt-3">
              {!justifyFile ? (
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm text-[#D06224] font-semibold hover:opacity-80 transition-opacity">
                  <Paperclip className="w-4 h-4" />
                  {t("attendanceDetail.justify_modal.attach_file")}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-[#D0622230] px-3 py-2 bg-[#FBF5E0]">
                  <Paperclip className="w-4 h-4 text-[#D06224] flex-shrink-0" />
                  <span className="text-sm text-[#2C1A0E] flex-1 truncate">{justifyFile.name}</span>
                  <button onClick={removeJustifyFile} className="text-[#E52929] hover:opacity-70 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleJustifyFileChange}
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowJustifyModal(false); setJustifyFile(null); setJustification(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] bg-[#FBF5E0] hover:bg-[#D06224]/10 transition-colors">
                {t("attendanceDetail.justify_modal.cancel")}
              </button>
              <button
                onClick={handleJustify}
                disabled={savingJustify || (!justification.trim() && !justifyFile)}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all hover:opacity-90"
                style={{ backgroundColor: "#D06224" }}>
                {savingJustify ? t("attendanceDetail.justify_modal.saving") : t("attendanceDetail.justify_modal.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal nota general ───────────────────────────────────────────────── */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                {t("attendanceDetail.note_modal.title")}
              </h3>
              <button onClick={() => { setShowNoteModal(false); setNoteFile(null); setNote(""); }}
                className="w-8 h-8 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
                <X className="w-4 h-4 text-[#2C1A0E]" />
              </button>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("attendanceDetail.note_modal.placeholder")}
              rows={4}
              className="w-full rounded-xl border border-[#1A6B3C30] p-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#1A6B3C]"
            />

            <div className="mt-3">
              {!noteFile ? (
                <button onClick={() => noteFileInputRef.current?.click()}
                  className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: "#1A6B3C" }}>
                  <Paperclip className="w-4 h-4" />
                  {t("attendanceDetail.justify_modal.attach_file")}
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-[#1A6B3C30] px-3 py-2 bg-[#FBF5E0]">
                  <Paperclip className="w-4 h-4 flex-shrink-0" style={{ color: "#1A6B3C" }} />
                  <span className="text-sm text-[#2C1A0E] flex-1 truncate">{noteFile.name}</span>
                  <button onClick={removeNoteFile} className="text-[#E52929] hover:opacity-70 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={noteFileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleNoteFileChange}
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowNoteModal(false); setNoteFile(null); setNote(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] bg-[#FBF5E0] hover:bg-[#D06224]/10 transition-colors">
                {t("attendanceDetail.justify_modal.cancel")}
              </button>
              <button
                onClick={handleSaveNote}
                disabled={savingNote || (!note.trim() && !noteFile)}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all hover:opacity-90"
                style={{ backgroundColor: "#1A6B3C" }}>
                {savingNote ? t("attendanceDetail.justify_modal.saving") : t("attendanceDetail.note_modal.save")}
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