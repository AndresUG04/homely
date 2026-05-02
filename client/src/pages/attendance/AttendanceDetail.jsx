import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import {
  CalendarDays, Clock3, CheckCircle2, AlertTriangle,
  ArrowLeft, ArrowRight, ChevronLeft,
} from "lucide-react";

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const JS_DAY_TO_DB = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
];

const statusStyles = {
  "Puntual":              { day: "bg-[#3F7D5815] text-[#3F7D58]",   dot: "bg-[#3F7D58]" },
  "Tardía":               { day: "bg-[#D0622415] text-[#D06224]",   dot: "bg-[#D06224]" },
  "Salida Anticipada":    { day: "bg-[#D0622415] text-[#D06224]",   dot: "bg-[#D06224]" },
  "Ausencia":             { day: "bg-[#AE431E15] text-[#AE431E]",   dot: "bg-[#AE431E]" },
  "Asistencia Justificada": { day: "bg-[#8A863515] text-[#8A8635]", dot: "bg-[#8A8635]" },
  "Marcas Irregulares":   { day: "bg-[#AE431E15] text-[#AE431E]",   dot: "bg-[#AE431E]" },
  workday:                { day: "bg-[#FBF5E0] text-[#2C1A0E]",     dot: null },
  nonworkday:             { day: "bg-transparent text-[#5C3A1E]/30", dot: null },
};

const statusColor = {
  "Puntual":                "#3F7D58",
  "Tardía":                 "#D06224",
  "Salida Anticipada":      "#D06224",
  "Ausencia":               "#AE431E",
  "Asistencia Justificada": "#8A8635",
  "Marcas Irregulares":     "#AE431E",
};

export default function AttendanceDetail({ contract, onBack }) {
  const { token } = useAuth();
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

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

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

  useEffect(() => {
    fetchAttendance();
  }, [month, year]);

  const getAttendanceForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendanceData.find(a => a.work_date.startsWith(dateStr)) || null;
  };

  const isWorkDay = (day) => {
    const date = new Date(year, month, day);
    const dayName = JS_DAY_TO_DB[date.getDay()];
    return workDayNames.includes(dayName);
  };

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const todayRecord = getAttendanceForDay(today.getDate());
  const todayIsWorkDay = isWorkDay(today.getDate());

  const stats = [
    {
      title: "Asistencias",
      value: attendanceData.filter(a => a.status === "Puntual").length,
      color: "#3F7D58", bg: "#3F7D5815", icon: CheckCircle2,
    },
    {
      title: "Tardanzas",
      value: attendanceData.filter(a => a.status === "Tardía").length,
      color: "#D06224", bg: "#D0622415", icon: Clock3,
    },
    {
      title: "Ausencias",
      value: attendanceData.filter(a => a.status === "Ausencia").length,
      color: "#AE431E", bg: "#AE431E15", icon: AlertTriangle,
    },
    {
      title: "Horas",
      value: (() => {
        const total = attendanceData.reduce((acc, a) => {
          if (a.check_in && a.check_out) {
            const diff = (new Date(a.check_out) - new Date(a.check_in)) / 3600000;
            return acc + diff;
          }
          return acc;
        }, 0);
        return `${Math.round(total)}h`;
      })(),
      color: "#8A8635", bg: "#8A863515", icon: CalendarDays,
    },
  ];

  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    if (newMonth < 0)  { newMonth = 11; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(1);
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    const data = await api.post("/api/attendance/check-in", { contractId: contract.id }, token);
    if (!data.error) await fetchAttendance();
    setCheckingIn(false);
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    const data = await api.post("/api/attendance/check-out", { contractId: contract.id }, token);
    if (!data.error) await fetchAttendance();
    setCheckingOut(false);
  };

  const handleJustify = async () => {
    const record = getAttendanceForDay(selectedDay);
    if (!record) return;
    setSavingJustify(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/attendance/${record.id}/justify`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ justification }),
    });
    if (res.ok) {
      await fetchAttendance();
      setShowJustifyModal(false);
      setJustification("");
    }
    setSavingJustify(false);
  };

  const selectedRecord = getAttendanceForDay(selectedDay);
  const selectedIsWorkDay = isWorkDay(selectedDay);

  const formatTime = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
  };

  const scheduleText = contract.contract_schedule
    .map(s => `${s.week_day.slice(0, 3)} ${s.start_time.slice(0, 5)}-${s.end_time.slice(0, 5)}`)
    .join(" · ");

  const canJustify = selectedRecord &&
    ["Ausencia", "Tardía", "Salida Anticipada", "Marcas Irregulares"].includes(selectedRecord.status) &&
    !selectedRecord.justification;

  return (
    <div className="space-y-6">
      <div
        className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
      >
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
              {checkingIn ? "Marcando..." : "Marcar Entrada"}
            </button>
          )}
          {todayIsWorkDay && todayRecord?.check_in && !todayRecord?.check_out && (
            <button onClick={handleCheckOut} disabled={checkingOut}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
              {checkingOut ? "Marcando..." : "Marcar Salida"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center"
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
              const day = i + 1;
              const record = getAttendanceForDay(day);
              const workDay = isWorkDay(day);
              let styleKey = workDay ? "workday" : "nonworkday";
              if (record?.status) styleKey = record.status;
              const style = statusStyles[styleKey] || statusStyles.nonworkday;
              return (
                <button key={day} onClick={() => workDay && setSelectedDay(day)} disabled={!workDay}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedDay === day && workDay ? "bg-[#2C1A0E] text-white scale-105 shadow-md" : style.day
                  } ${!workDay ? "cursor-default" : "cursor-pointer"}`}>
                  {day}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[#D0622210]">
            {[
              { label: "Puntual", color: "#3F7D58" },
              { label: "Tardía", color: "#D06224" },
              { label: "Ausencia", color: "#AE431E" },
              { label: "Justificada", color: "#8A8635" },
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
            Día {selectedDay}
          </h2>
          {!selectedIsWorkDay ? (
            <p className="text-sm text-[#5C3A1E]/60">Este día no es laboral según tu contrato.</p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
                <p className="text-xs text-[#5C3A1E]/60">Entrada</p>
                <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">{formatTime(selectedRecord?.check_in)}</p>
              </div>
              <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
                <p className="text-xs text-[#5C3A1E]/60">Salida</p>
                <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">{formatTime(selectedRecord?.check_out)}</p>
              </div>
              {selectedRecord?.status && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: `${statusColor[selectedRecord.status]}15` }}>
                  <p className="text-xs text-[#5C3A1E]/60">Estado</p>
                  <p className="text-base font-bold mt-0.5" style={{ color: statusColor[selectedRecord.status] }}>
                    {selectedRecord.status}
                  </p>
                </div>
              )}
              {selectedRecord?.justification && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#8A863515" }}>
                  <p className="text-xs text-[#5C3A1E]/60">Justificación</p>
                  <p className="text-sm text-[#2C1A0E] mt-0.5">{selectedRecord.justification}</p>
                </div>
              )}
              {canJustify && (
                <button onClick={() => setShowJustifyModal(true)}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-2 transition-all hover:opacity-90"
                  style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
                  Agregar Justificación
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showJustifyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
            <h3 className="text-xl font-bold text-[#2C1A0E] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Agregar Justificación
            </h3>
            <textarea value={justification} onChange={e => setJustification(e.target.value)}
              placeholder="Explica el motivo de la ausencia o tardanza..." rows={4}
              className="w-full rounded-xl border border-[#D0622230] p-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#D06224]" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowJustifyModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] bg-[#FBF5E0] hover:bg-[#D06224]/10 transition-colors">
                Cancelar
              </button>
              <button onClick={handleJustify} disabled={savingJustify || !justification.trim()}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all hover:opacity-90"
                style={{ backgroundColor: "#D06224" }}>
                {savingJustify ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}