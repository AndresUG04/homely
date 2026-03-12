import { useAuth } from "../../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../../config/supabase";
import {
  FileText,
  Clock,
  DollarSign,
  Gift,
  ArrowRight,
  AlertCircle,
  Star,
} from "lucide-react";

export default function WorkerHome() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const fetchName = async () => {
      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setFullName(data?.full_name || "");
    };
    if (user) fetchName();
  }, [user]);

  const stats = [
    {
      label: "Contratos activos",
      value: "0",
      icon: FileText,
      color: "#D06224",
      bg: "#D0622215",
    },
    {
      label: "Asistencia este mes",
      value: "0 días",
      icon: Clock,
      color: "#8A8635",
      bg: "#8A863515",
    },
    {
      label: "Último pago",
      value: "₡0",
      icon: DollarSign,
      color: "#AE431E",
      bg: "#AE431E15",
    },
    {
      label: "Beneficios acumulados",
      value: "₡0",
      icon: Gift,
      color: "#6B6828",
      bg: "#6B682815",
    },
  ];

  const quickActions = [
    { label: "Confirmar asistencia", icon: Clock, color: "#8A8635" },
    { label: "Ver mis pagos", icon: DollarSign, color: "#D06224" },
    { label: "Mi perfil portátil", icon: Star, color: "#AE431E" },
  ];

  return (
    <div className="space-y-8">
      {/* Título */}
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Mi resumen
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          Tu situación laboral de un vistazo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl px-6 py-5 flex items-center gap-4"
            style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bg }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p
                className="text-2xl font-bold text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {value}
              </p>
              <p className="text-xs text-[#5C3A1E]/60 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acciones rápidas */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <h2
            className="text-base font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Acciones rápidas
          </h2>
          <div className="space-y-3">
            {quickActions.map(({ label, icon: Icon, color }) => (
              <button
                key={label}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: `${color}10`, color }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Actividad reciente */}
        <div
          className="lg:col-span-2 bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <h2
            className="text-base font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Actividad reciente
          </h2>
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-[#D06224]/40" />
            </div>
            <p className="text-sm text-[#5C3A1E]/40 text-center">
              No hay actividad reciente.
              <br />
              Tu empleador aún no ha registrado actividad.
            </p>
          </div>
        </div>
      </div>

      {/* Banner perfil portátil */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #8A8635 0%, #6B6828 100%)",
          boxShadow: "0 8px 24px rgba(138,134,53,0.25)",
        }}
      >
        <div>
          <p
            className="text-[#FBF5E0] font-bold text-base"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Completá tu perfil portátil
          </p>
          <p className="text-[#FBF5E0]/70 text-sm mt-0.5">
            Un perfil completo te ayuda a conseguir más empleadores
          </p>
        </div>
        <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-[#FBF5E0] text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 flex-shrink-0">
          Completar <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
