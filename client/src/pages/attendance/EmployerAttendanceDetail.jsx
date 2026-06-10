import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import {
  CheckCircle2, AlertTriangle, Clock3, ArrowLeft, ArrowRight,
  ChevronLeft, CheckCheck, MessageSquare, X, XCircle,
} from "lucide-react";

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
  "Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"
];

const extractTime = (ts) => {
  if (!ts) return null;
  const normalized = ts.replace(" ", "T").replace("Z", "");
  return normalized.slice(11, 16);
};

export default function EmployerAttendanceDetail({ contract, workerName, onBack }) {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const today = new Date();
  const locale = i18n.language === "fr" ? "fr-FR" : i18n.language === "en" ? "en-US" : "es-CR";

  const [month, setMonth]               = useState(today.getMonth());
  const [year, setYear]                 = useState(today.getFullYear());
  const [selectedDay, setSelectedDay]   = useState(today.getDate());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading]           = useState(true);

  const [showObsModal, setShowObsModal] = useState(false);
  const [obsText, setObsText]           = useState("");
  const [savingObs, setSavingObs]       = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason]       = useState("");
  const [rejecting, setRejecting]             = useState(false);

  const [approvingId, setApprovingId] = useState(null);

  const monthNames = t("attendanceDetail.months", { returnObjects: true });
  const weekDays   = t("attendanceDetail.weekdays", { returnObjects: true });

  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDay     = new Date(year, month, 1).getDay();
  const workDayNames = contract.contract_schedule.map(s => s.week_day);

  const fetchAttendance = async () => {
    setLoading(true);
    const data = await api.get(
      `/api/attendance/employer/${contract.id}/${year}/${month + 1}`,
      token
    );
    if (!data.error) setAttendanceData(data.attendance || []);
    setLoading(false);
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

  const selectedRecord    = getAttendanceForDay(selectedDay);
  const selectedIsWorkDay = isWorkDay(selectedDay);

  const stats = [
    {
      title: t("employerAttendance.stats.attendances"),
      value: attendanceData.filter(a => ["Puntual","Asistencia Justificada"].includes(a.status)).length,
      color: "#3F7D58", bg: "#3F7D5815", icon: CheckCircle2,
    },
    {
      title: t("employerAttendance.stats.tardiness"),
      value: attendanceData.filter(a => ["Tardía","Salida Anticipada"].includes(a.status)).length,
      color: "#B8860B", bg: "#F5C84215", icon: Clock3,
    },
    {
      title: t("employerAttendance.stats.absences"),
      value: attendanceData.filter(a => ["Ausencia","Marcas Irregulares"].includes(a.status)).length,
      color: "#E52929", bg: "#E5292915", icon: AlertTriangle,
    },
    {
      title: t("employerAttendance.stats.approved"),
      value: attendanceData.filter(a => a.approved).length,
      color: "#3F7D58", bg: "#3F7D5815", icon: CheckCheck,
    },
  ];

  const changeMonth = (dir) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setMonth(m); setYear(y); setSelectedDay(1);
  };

  const formatTime = (ts) => {
    if (!ts) return "—";
    const timePart = extractTime(ts);
    if (!timePart) return "—";
    const [h, m] = timePart.split(":").map(Number);
    const d = new Date(2000, 0, 1, h, m);
    return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const handleApprove = async (record) => {
    if (!record || record.approved) return;
    setApprovingId(record.id);
    await api.patch(`/api/attendance/${record.id}/approve`, {}, token);
    await fetchAttendance();
    setApprovingId(null);
  };

  const handleSaveObs = async () => {
    if (!selectedRecord) return;
    setSavingObs(true);
    await api.patch(`/api/attendance/${selectedRecord.id}/observe`, { observation: obsText }, token);
    await fetchAttendance();
    setShowObsModal(false);
    setObsText("");
    setSavingObs(false);
  };

  const handleReject = async () => {
    if (!selectedRecord || !rejectReason.trim()) return;
    setRejecting(true);
    await api.patch(`/api/attendance/${selectedRecord.id}/reject`, { rejection_reason: rejectReason }, token);
    await fetchAttendance();
    setShowRejectModal(false);
    setRejectReason("");
    setRejecting(false);
  };

  const getDayBg = (day, record, workDay) => {
    if (selectedDay === day && workDay) return "#2C1A0E";
    if (!workDay) return "transparent";
    if (!record?.status) return "#FBF5E0";
    return statusBgColor[record.status] || "#FBF5E0";
  };

  const getDayColor = (day, record, workDay) => {
    if (selectedDay === day && workDay) return "#FFFFFF";
    if (!workDay) return "rgba(92,58,30,0.3)";
    if (!record?.status) return "#2C1A0E";
    return "#FFFFFF";
  };

  const scheduleText = contract.contract_schedule
    .map(s => `${s.week_day.slice(0,3)} ${s.start_time.slice(0,5)}-${s.end_time.slice(0,5)}`)
    .join(" · ");

  return (
    <div className="space-y-6">

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
            <div>
              <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                {workerName || t("employerAttendance.worker")}
              </h1>
              <p className="text-sm text-[#5C3A1E]/60">{contract.title}</p>
            </div>
          </div>
          <p className="text-xs text-[#5C3A1E]/40 mt-1">{scheduleText}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title}
              className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center"
              style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)", border: "2px solid #FBF5E0" }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: item.bg }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h2 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>{item.value}</h2>
              <p className="text-xs text-[#5C3A1E]/60 mt-1">{item.title}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
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
            {weekDays.map(d => (
              <div key={d} className="text-center text-xs font-semibold text-[#5C3A1E]/50 py-1">{d}</div>
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
                    color: getDayColor(day, record, workDay),
                    transform: selectedDay === day && workDay ? "scale(1.05)" : "scale(1)",
                    boxShadow: selectedDay === day && workDay ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                    cursor: workDay ? "pointer" : "default",
                  }}>
                  {day}
                  {record?.approved && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white opacity-80" />
                  )}
                  {record?.rejection_reason && !record?.approved && (
                    <span className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full bg-white opacity-80" />
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
          </div>
        </div>

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
                    {selectedRecord.status}
                  </p>
                </div>
              )}

              {selectedRecord?.justification && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#8A863515" }}>
                  <p className="text-xs text-[#5C3A1E]/60">{t("attendanceDetail.day_panel.justification")}</p>
                  <p className="text-sm text-[#2C1A0E] mt-0.5">{selectedRecord.justification}</p>
                </div>
              )}

              {selectedRecord?.observation && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D0622210" }}>
                  <p className="text-xs text-[#5C3A1E]/60">{t("employerAttendance.observation")}</p>
                  <p className="text-sm text-[#2C1A0E] mt-0.5">{selectedRecord.observation}</p>
                </div>
              )}

              {selectedRecord?.rejection_reason && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#E5292912", border: "1px solid #E5292930" }}>
                  <p className="text-xs font-medium" style={{ color: "#E52929" }}>{t("employerAttendance.reject_modal.title")}</p>
                  <p className="text-sm text-[#2C1A0E] mt-0.5">{selectedRecord.rejection_reason}</p>
                </div>
              )}

              {selectedRecord?.approved && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ backgroundColor: "#3F7D5815" }}>
                  <CheckCheck className="w-4 h-4 text-[#3F7D58]" />
                  <p className="text-sm font-semibold text-[#3F7D58]">{t("employerAttendance.approved")}</p>
                </div>
              )}

              {selectedRecord && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    {!selectedRecord.approved && (
                      <button
                        onClick={() => handleApprove(selectedRecord)}
                        disabled={approvingId === selectedRecord.id}
                        className="flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#3F7D58" }}>
                        <CheckCheck className="w-3.5 h-3.5" />
                        {approvingId === selectedRecord.id ? "..." : t("employerAttendance.approve")}
                      </button>
                    )}
                    <button
                      onClick={() => { setRejectReason(""); setShowRejectModal(true); }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{ backgroundColor: "#E5292915", color: "#E52929", border: "1px solid #E5292930" }}>
                      <XCircle className="w-3.5 h-3.5" />
                      {t("employerAttendance.reject")}
                    </button>
                  </div>
                  <button
                    onClick={() => { setObsText(selectedRecord.observation || ""); setShowObsModal(true); }}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-80"
                    style={{ backgroundColor: "#D0622215", color: "#D06224" }}>
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t("employerAttendance.add_observation")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showObsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                {t("employerAttendance.obs_modal.title")}
              </h3>
              <button onClick={() => setShowObsModal(false)}
                className="w-8 h-8 rounded-xl bg-[#FBF5E0] flex items-center justify-center">
                <X className="w-4 h-4 text-[#2C1A0E]" />
              </button>
            </div>
            <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "#D062220D" }}>
              <p className="text-xs text-[#5C3A1E]/60">{t("employerAttendance.obs_modal.day_label")}</p>
              <p className="text-sm font-semibold text-[#2C1A0E]">
                {selectedDay} {monthNames[month]} {year}
                {selectedRecord?.status && (
                  <span className="ml-2 text-xs font-normal" style={{ color: statusColor[selectedRecord.status] }}>
                    · {selectedRecord.status}
                  </span>
                )}
              </p>
            </div>
            <textarea
              value={obsText}
              onChange={e => setObsText(e.target.value)}
              placeholder={t("employerAttendance.obs_modal.placeholder")}
              rows={4}
              className="w-full rounded-xl border border-[#D0622230] p-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#D06224]"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowObsModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] bg-[#FBF5E0]">
                {t("attendanceDetail.justify_modal.cancel")}
              </button>
              <button onClick={handleSaveObs} disabled={savingObs || !obsText.trim()}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#D06224" }}>
                {savingObs ? t("attendanceDetail.justify_modal.saving") : t("attendanceDetail.justify_modal.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                {t("employerAttendance.reject_modal.title")}
              </h3>
              <button onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-xl bg-[#FBF5E0] flex items-center justify-center">
                <X className="w-4 h-4 text-[#2C1A0E]" />
              </button>
            </div>
            <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "#E5292910", border: "1px solid #E5292925" }}>
              <p className="text-xs text-[#5C3A1E]/60">{t("employerAttendance.reject_modal.record_label")}</p>
              <p className="text-sm font-semibold text-[#2C1A0E]">
                {selectedDay} {monthNames[month]} {year}
                {selectedRecord?.status && (
                  <span className="ml-2 text-xs font-normal" style={{ color: statusColor[selectedRecord.status] }}>
                    · {selectedRecord.status}
                  </span>
                )}
              </p>
              {selectedRecord?.check_in && (
                <p className="text-xs text-[#5C3A1E]/50 mt-1">
                  {t("attendanceDetail.day_panel.check_in")}: {formatTime(selectedRecord.check_in)}
                  {selectedRecord?.check_out && ` · ${t("attendanceDetail.day_panel.check_out")}: ${formatTime(selectedRecord.check_out)}`}
                </p>
              )}
            </div>
            <label className="text-xs text-[#5C3A1E]/60 font-medium">
              {t("employerAttendance.reject_modal.reason_label")}<span style={{ color: "#E52929" }}>*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={t("employerAttendance.reject_modal.reason_placeholder")}
              rows={4}
              className="w-full mt-1 rounded-xl border border-[#E5292930] p-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#E52929]"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] bg-[#FBF5E0]">
                {t("employerAttendance.reject_modal.cancel")}
              </button>
              <button onClick={handleReject} disabled={rejecting || !rejectReason.trim()}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#E52929" }}>
                <XCircle className="w-4 h-4" />
                {rejecting ? t("employerAttendance.reject_modal.confirming") : t("employerAttendance.reject_modal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}