import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function Attendance() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const stats = [
    { title: "Asistencias", value: 18,    color: "#3F7D58", bg: "#3F7D5815", icon: CheckCircle2 },
    { title: "Tardanzas",   value: 3,     color: "#D06224", bg: "#D0622415", icon: Clock3 },
    { title: "Ausencias",   value: 1,     color: "#AE431E", bg: "#AE431E15", icon: AlertTriangle },
    { title: "Horas",       value: "96h", color: "#8A8635", bg: "#8A863515", icon: CalendarDays },
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

  const getStatus = (day) => {
    if (day % 7 === 0) return "late";
    if (day % 11 === 0) return "absent";
    return "ok";
  };

  const statusStyles = {
    ok:     "bg-[#3F7D5815] text-[#3F7D58]",
    late:   "bg-[#D0622415] text-[#D06224]",
    absent: "bg-[#AE431E15] text-[#AE431E]",
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div
        className="bg-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
        style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
      >
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            Mi Asistencia
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">
            Gestiona entradas, salidas y control mensual de tus asistencias.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="px-5 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#3F7D58", boxShadow: "0 4px 12px rgba(63,125,88,0.25)" }}
          >
            Marcar Entrada
          </button>
          <button
            className="px-5 py-3 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#D06224", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}
          >
            Marcar Salida
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center"
              style={{
                boxShadow: "0 2px 12px rgba(208,98,36,0.08)",
                border: "2px solid #FBF5E0",
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3"
                style={{ backgroundColor: item.bg }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h2
                className="text-3xl font-bold text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {item.value}
              </h2>
              <p className="text-xs text-[#5C3A1E]/60 mt-1">{item.title}</p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#2C1A0E]" />
            </button>

            <h2 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
              {monthNames[month]} {year}
            </h2>

            <button
              onClick={() => changeMonth(1)}
              className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-[#2C1A0E]" />
            </button>
          </div>

          {/* Week names */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-[#5C3A1E]/50 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={i} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = getStatus(day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selectedDay === day
                      ? "bg-[#2C1A0E] text-white scale-105 shadow-md"
                      : statusStyles[status]
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#D0622210]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#3F7D58]" />
              <span className="text-xs text-[#5C3A1E]/60">Puntual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#D06224]" />
              <span className="text-xs text-[#5C3A1E]/60">Tardanza</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#AE431E]" />
              <span className="text-xs text-[#5C3A1E]/60">Ausencia</span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <h2 className="text-xl font-bold text-[#2C1A0E] mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
            Día {selectedDay}
          </h2>

          <div className="space-y-3">
            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
              <p className="text-xs text-[#5C3A1E]/60">Entrada</p>
              <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">7:03 am</p>
            </div>

            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#D062220D" }}>
              <p className="text-xs text-[#5C3A1E]/60">Salida</p>
              <p className="text-lg font-bold text-[#2C1A0E] mt-0.5">1:00 pm</p>
            </div>

            <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#3F7D5810" }}>
              <p className="text-xs text-[#5C3A1E]/60">Estado</p>
              <p className="text-base font-bold mt-0.5" style={{ color: "#3F7D58" }}>
                Puntual ✓
              </p>
            </div>

            <button
              className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: "#D06224",
                boxShadow: "0 4px 12px rgba(208,98,36,0.25)",
              }}
            >
              Agregar Justificación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}