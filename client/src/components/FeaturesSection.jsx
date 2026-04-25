import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const titleRef = useRef(null);

  const employerFeatures = [
    { icon: FileText,   title: t("features.empleador.items.contrato_titulo"),  description: t("features.empleador.items.contrato_desc") },
    { icon: Clock,      title: t("features.empleador.items.asistencia_titulo"), description: t("features.empleador.items.asistencia_desc") },
    { icon: CreditCard, title: t("features.empleador.items.pagos_titulo"),      description: t("features.empleador.items.pagos_desc") },
    { icon: BarChart3,  title: t("features.empleador.items.dashboard_titulo"),  description: t("features.empleador.items.dashboard_desc") },
    { icon: Bell,       title: t("features.empleador.items.alertas_titulo"),    description: t("features.empleador.items.alertas_desc") },
    { icon: Download,   title: t("features.empleador.items.reportes_titulo"),   description: t("features.empleador.items.reportes_desc") },
  ];

  const workerFeatures = [
    { icon: Briefcase,  title: t("features.trabajadora.items.perfil_titulo"),      description: t("features.trabajadora.items.perfil_desc") },
    { icon: UserCheck,  title: t("features.trabajadora.items.registro_titulo"),    description: t("features.trabajadora.items.registro_desc") },
    { icon: Star,       title: t("features.trabajadora.items.referencias_titulo"), description: t("features.trabajadora.items.referencias_desc") },
    { icon: Calendar,   title: t("features.trabajadora.items.calendario_titulo"),  description: t("features.trabajadora.items.calendario_desc") },
    { icon: Shield,     title: t("features.trabajadora.items.beneficios_titulo"),  description: t("features.trabajadora.items.beneficios_desc") },
    { icon: Globe,      title: t("features.trabajadora.items.multiidioma_titulo"), description: t("features.trabajadora.items.multiidioma_desc") },
  ];

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
            {t("features.label")}
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("features.titulo")}{" "}
            <span className="text-[#D06224] italic">{t("features.titulo_span")}</span>
          </h2>
          <p className="text-[#5C3A1E]/70 text-lg max-w-2xl mx-auto">
            {t("features.descripcion")}
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
                  {t("features.empleador.titulo")}
                </h3>
                <p className="text-sm text-[#5C3A1E]/60">
                  {t("features.empleador.subtitulo")}
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
                  {t("features.trabajadora.titulo")}
                </h3>
                <p className="text-sm text-[#5C3A1E]/60">
                  {t("features.trabajadora.subtitulo")}
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