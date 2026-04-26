import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus, FileSignature, CheckCircle, TrendingUp } from "lucide-react";

export default function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    { step: "01", icon: UserPlus,       color: "#D06224", title: t("how.steps.01.title"), description: t("how.steps.01.description") },
    { step: "02", icon: FileSignature,  color: "#AE431E", title: t("how.steps.02.title"), description: t("how.steps.02.description") },
    { step: "03", icon: CheckCircle,    color: "#8A8635", title: t("how.steps.03.title"), description: t("how.steps.03.description") },
    { step: "04", icon: TrendingUp,     color: "#D06224", title: t("how.steps.04.title"), description: t("how.steps.04.description") },
  ];

  const stepsRef = useRef([]);
  const imageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0) translateX(0)";
          }
        });
      },
      { threshold: 0.15 },
    );

    stepsRef.current.forEach((el, i) => {
      if (el) {
        el.style.transitionDelay = `${i * 120}ms`;
        observer.observe(el);
      }
    });
    if (imageRef.current) observer.observe(imageRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="como-funciona" className="py-24 overflow-hidden" style={{ background: "#F5EDD4" }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#8A8635] font-semibold text-sm tracking-widest uppercase mb-3">
            {t("how.label")}
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("how.titulo")}{" "}
            <span className="text-[#D06224] italic">{t("how.titulo_span")}</span>
          </h2>
          <p className="text-[#5C3A1E]/70 text-lg max-w-xl mx-auto">
            {t("how.descripcion")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div
                key={step.step}
                ref={(el) => { stepsRef.current[i] = el; }}
                className="flex gap-5 group"
                style={{
                  opacity: 0,
                  transform: "translateX(-24px)",
                  transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
                }}
              >
                {/* Step number + icon */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style={{ background: step.color, boxShadow: `0 8px 24px ${step.color}40` }}
                  >
                    <step.icon className="w-6 h-6 text-[#FBF5E0]" strokeWidth={1.8} />
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="w-px flex-1 mt-3 mb-0"
                      style={{ background: `${step.color}30`, minHeight: "24px" }}
                    />
                  )}
                </div>

                {/* Content */}
                <div className="pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold tracking-widest" style={{ color: step.color }}>
                      {t("how.paso")} {step.step}
                    </span>
                  </div>
                  <h3
                    className="text-xl font-bold text-[#2C1A0E] mb-2"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[#5C3A1E]/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dashboard image */}
          <div
            ref={imageRef}
            className="relative"
            style={{
              opacity: 0,
              transform: "translateX(24px)",
              transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
            }}
          >
            <div
              className="rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 24px 80px rgba(174,67,30,0.2), 0 8px 24px rgba(208,98,36,0.12)" }}
            >
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663418597851/9JwqepjoByGTkBDVWtkWA5/homely-dashboard-E8Q4946NkzyVtchw2GsqzU.webp"
                alt="Dashboard de Homely mostrando asistencia y pagos"
                className="w-full h-auto"
              />
            </div>
            <div
              className="absolute -z-10 -bottom-8 -right-8 w-64 h-64 opacity-20 pointer-events-none"
              style={{ background: "#D06224", borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}