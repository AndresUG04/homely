import { useEffect, useRef } from "react";
import {
  FileText,
  Clock,
  CreditCard,
  BarChart3,
  Bell,
  Download,
  UserCheck,
  Calendar,
  Star,
  Shield,
  Globe,
  Briefcase,
} from "lucide-react";

const employerFeatures = [
  {
    icon: FileText,
    title: "Contrato digital",
    description:
      "Crea y envía contratos laborales adaptados a la legislación de tu país. Firma digital incluida.",
  },
  {
    icon: Clock,
    title: "Control de asistencia",
    description:
      "Aprueba entradas, salidas y ausencias. Historial completo en tiempo real.",
  },
  {
    icon: CreditCard,
    title: "Gestión de pagos",
    description:
      "Registra pagos, sube comprobantes y descarga PDFs de cada transacción.",
  },
  {
    icon: BarChart3,
    title: "Dashboard financiero",
    description:
      "Estadísticas mensuales y anuales. Visualiza el comportamiento económico del contrato.",
  },
  {
    icon: Bell,
    title: "Alertas automáticas",
    description:
      "Recibe notificaciones de fechas de pago, vencimientos y beneficios acumulados.",
  },
  {
    icon: Download,
    title: "Reportes descargables",
    description:
      "Genera reportes en PDF para cualquier período. Respaldo legal ante cualquier disputa.",
  },
];

const workerFeatures = [
  {
    icon: Briefcase,
    title: "Perfil laboral portátil",
    description:
      "Tu historial verificado te acompaña a cualquier país. El LinkedIn del empleo doméstico.",
  },
  {
    icon: UserCheck,
    title: "Registro de asistencia",
    description:
      "Confirma tu entrada y salida. Consulta registros aceptados, pendientes y rechazados.",
  },
  {
    icon: Star,
    title: "Referencias verificadas",
    description:
      "Recibe referencias digitales de empleadores anteriores, confirmadas en la plataforma.",
  },
  {
    icon: Calendar,
    title: "Calendario laboral",
    description:
      "Visualiza fechas de pago, descansos y vencimiento de contrato en un solo lugar.",
  },
  {
    icon: Shield,
    title: "Beneficios acumulados",
    description:
      "Consulta en tiempo real tu saldo de vacaciones, aguinaldo y otros beneficios.",
  },
  {
    icon: Globe,
    title: "Multiidioma",
    description:
      "Cambia el idioma entre español, inglés y francés en cualquier momento.",
  },
];

function FeatureCard({ icon: Icon, title, description, delay }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (cardRef.current) {
              cardRef.current.style.opacity = "1";
              cardRef.current.style.transform = "translateY(0)";
            }
          }, delay);
        }
      },
      { threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={cardRef}
      className="group bg-white rounded-2xl p-6 border border-[#D06224]/8 hover:border-[#D06224]/25 transition-all duration-300 hover:-translate-y-1"
      style={{
        opacity: 0,
        transform: "translateY(24px)",
        transition:
          "opacity 0.6s ease-out, transform 0.6s ease-out, box-shadow 0.3s, border-color 0.3s, translate 0.3s",
        boxShadow: "0 2px 12px rgba(208,98,36,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(208,98,36,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(208,98,36,0.06)";
      }}
    >
      <div className="w-11 h-11 rounded-xl bg-[#D06224]/10 flex items-center justify-center mb-4 group-hover:bg-[#D06224]/18 transition-colors duration-300">
        <Icon className="w-5 h-5 text-[#D06224]" strokeWidth={1.8} />
      </div>
      <h3 className="font-semibold text-[#2C1A0E] mb-2 text-base">{title}</h3>
      <p className="text-sm text-[#5C3A1E]/70 leading-relaxed">{description}</p>
    </div>
  );
}

export default function FeaturesSection() {
  const titleRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && titleRef.current) {
          titleRef.current.style.opacity = "1";
          titleRef.current.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.2 },
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="funcionalidades" className="py-24 bg-[#FBF5E0]">
      <div className="container">
        {/* Header */}
        <div
          ref={titleRef}
          className="text-center mb-16"
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            transition: "all 0.7s ease-out",
          }}
        >
          <p className="text-[#8A8635] font-semibold text-sm tracking-widest uppercase mb-3">
            Funcionalidades
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Todo lo que necesitas,{" "}
            <span className="text-[#D06224] italic">en un solo lugar</span>
          </h2>
          <p className="text-[#5C3A1E]/70 text-lg max-w-2xl mx-auto">
            Homely centraliza el control de horas, pagos, contratos y
            beneficios. Elimina el papel, los grupos de WhatsApp y los acuerdos
            verbales.
          </p>
        </div>

        {/* Two-column tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Employer column */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#D06224] flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[#FBF5E0]" />
              </div>
              <div>
                <h3
                  className="font-bold text-[#2C1A0E] text-lg"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Para el Empleador
                </h3>
                <p className="text-sm text-[#5C3A1E]/60">
                  Gestión completa del contrato laboral
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employerFeatures.map((f, i) => (
                <FeatureCard key={f.title} {...f} delay={i * 80} />
              ))}
            </div>
          </div>

          {/* Worker column */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#8A8635] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#FBF5E0]" />
              </div>
              <div>
                <h3
                  className="font-bold text-[#2C1A0E] text-lg"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Para la Trabajadora
                </h3>
                <p className="text-sm text-[#5C3A1E]/60">
                  Perfil portátil y derechos protegidos
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workerFeatures.map((f, i) => (
                <FeatureCard key={f.title} {...f} delay={i * 80} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
