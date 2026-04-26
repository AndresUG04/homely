import { useState } from "react";
import {
  Home,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Attendance() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const stats = [
    {
      title: "Asistencias",
      value: 18,
      color: "#3F7D58",
      bg: "#3F7D5815",
      icon: CheckCircle2,
    },
    {
      title: "Tardanzas",
      value: 3,
      color: "#D06224",
      bg: "#D0622415",
      icon: Clock3,
    },
    {
      title: "Ausencias",
      value: 1,
      color: "#AE431E",
      bg: "#AE431E15",
      icon: AlertTriangle,
    },
    {
      title: "Horas",
      value: "96h",
      color: "#8A8635",
      bg: "#8A863515",
      icon: CalendarDays,
    },
  ];

  const changeMonth = (dir) => {
    let newMonth = month + dir;
    let newYear = year;

    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }

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
    ok: "bg-[#3F7D5815] text-[#3F7D58]",
    late: "bg-[#D0622415] text-[#D06224]",
    absent: "bg-[#AE431E15] text-[#AE431E]",
  };

  return (
    <div
      className="min-h-screen w-full p-6"
      style={{
        background:
          "linear-gradient(135deg, #FBF5E0 0%, #F0E8C8 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="bg-white rounded-3xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5"
          style={{
            boxShadow: "0 24px 80px rgba(208,98,36,0.12)",
          }}
        >
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 w-fit">
              <div className="w-10 h-10 rounded-xl bg-[#D06224] flex items-center justify-center">
                <Home className="w-5 h-5 text-[#FBF5E0]" />
              </div>

              <span
                className="text-2xl font-bold text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Homely
              </span>
            </Link>

            <h1
              className="text-4xl font-bold text-[#2C1A0E]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Asistencia
            </h1>

            <p className="text-[#5C3A1E]/60 mt-2">
              Gestiona entradas, salidas y control mensual de tus asistencias.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="px-5 py-3 rounded-xl text-white font-semibold"
              style={{
                backgroundColor: "#3F7D58",
              }}
            >
              Marcar Entrada
            </button>

            <button
              className="px-5 py-3 rounded-xl text-white font-semibold"
              style={{
                backgroundColor: "#D06224",
              }}
            >
              Marcar Salida
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="bg-white rounded-3xl p-5"
                style={{
                  boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: item.bg }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: item.color }}
                  />
                </div>

                <p className="text-sm text-[#5C3A1E]/60">
                  {item.title}
                </p>

                <h2 className="text-3xl font-bold text-[#2C1A0E] mt-1">
                  {item.value}
                </h2>
              </div>
            );
          })}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div
            className="lg:col-span-2 bg-white rounded-3xl p-6"
            style={{
              boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5 text-[#2C1A0E]" />
              </button>

              <h2
                className="text-2xl font-bold text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {monthNames[month]} {year}
              </h2>

              <button
                onClick={() => changeMonth(1)}
                className="w-10 h-10 rounded-xl bg-[#FBF5E0] flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 text-[#2C1A0E]" />
              </button>
            </div>

            {/* Week names */}
            <div className="grid grid-cols-7 gap-3 mb-3">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-[#5C3A1E]/60"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={i}></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const status = getStatus(day);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`h-14 rounded-2xl font-semibold transition-all duration-200 ${
                      selectedDay === day
                        ? "bg-[#2C1A0E] text-white scale-105"
                        : statusStyles[status]
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div
            className="bg-white rounded-3xl p-6"
            style={{
              boxShadow: "0 16px 40px rgba(0,0,0,0.05)",
            }}
          >
            <h2
              className="text-2xl font-bold text-[#2C1A0E] mb-5"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Día {selectedDay}
            </h2>

            <div className="space-y-4">
              <div className="bg-[#FBF5E0] rounded-2xl p-4">
                <p className="text-sm text-[#5C3A1E]/60">
                  Entrada
                </p>
                <h3 className="text-xl font-bold text-[#2C1A0E]">
                  7:03 am
                </h3>
              </div>

              <div className="bg-[#FBF5E0] rounded-2xl p-4">
                <p className="text-sm text-[#5C3A1E]/60">
                  Salida
                </p>
                <h3 className="text-xl font-bold text-[#2C1A0E]">
                  1:00 pm
                </h3>
              </div>

              <div className="bg-[#FBF5E0] rounded-2xl p-4">
                <p className="text-sm text-[#5C3A1E]/60">
                  Estado
                </p>
                <h3 className="text-xl font-bold text-[#3F7D58]">
                  Asistencia registrada Puntual
                </h3>
              </div>

              <button
                className="w-full py-3 rounded-2xl text-white font-semibold mt-4"
                style={{
                  backgroundColor: "#D06224",
                }}
              >
                Agregar Justificación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}