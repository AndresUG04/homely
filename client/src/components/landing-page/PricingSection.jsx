import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";

export default function PricingSection() {
  const { t } = useTranslation();

  const plans = [
    { key: "basico",  highlight: false, color: "#8A8635" },
    { key: "pro",     highlight: true,  color: "#D06224" },
    { key: "familia", highlight: false, color: "#AE431E" },
  ];

  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1 },
    );
    cardsRef.current.forEach((el, i) => {
      if (el) {
        el.style.transitionDelay = `${i * 100}ms`;
        observer.observe(el);
      }
    });
    return () => observer.disconnect();
  }, []);

  return (
    <section id="planes" className="py-24 bg-[#FBF5E0]">
      <div className="container">
        <div className="text-center mb-16">
          <p className="text-[#8A8635] font-semibold text-sm tracking-widest uppercase mb-3">
            {t("pricing.label")}
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("pricing.titulo")}{" "}
            <span className="text-[#D06224] italic">{t("pricing.titulo_span")}</span>
          </h2>
          <p className="text-[#5C3A1E]/70 text-lg max-w-xl mx-auto">
            {t("pricing.descripcion")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const name        = t(`pricing.plans.${plan.key}.name`);
            const price       = t(`pricing.plans.${plan.key}.price`);
            const period      = t(`pricing.plans.${plan.key}.period`);
            const description = t(`pricing.plans.${plan.key}.description`);
            const cta         = t(`pricing.plans.${plan.key}.cta`);
            const features    = t(`pricing.plans.${plan.key}.features`, { returnObjects: true });

            return (
              <div
                key={plan.key}
                ref={(el) => { cardsRef.current[i] = el; }}
                className={`relative rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                  plan.highlight
                    ? "bg-[#2C1A0E] text-[#FBF5E0]"
                    : "bg-white border border-[#D06224]/10"
                }`}
                style={{
                  opacity: 0,
                  transform: "translateY(30px)",
                  transition: "opacity 0.6s ease-out, transform 0.6s ease-out, translate 0.3s",
                  boxShadow: plan.highlight
                    ? "0 24px 80px rgba(208,98,36,0.3)"
                    : "0 4px 20px rgba(208,98,36,0.08)",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 bg-[#D06224] text-[#FBF5E0] text-xs font-bold px-4 py-1.5 rounded-full">
                      <Zap className="w-3 h-3" />
                      {t("pricing.popular")}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${plan.color}${plan.highlight ? "30" : "15"}` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ background: plan.color }} />
                  </div>
                  <h3
                    className={`text-xl font-bold mb-1 ${plan.highlight ? "text-[#FBF5E0]" : "text-[#2C1A0E]"}`}
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    {name}
                  </h3>
                  <p className={`text-sm ${plan.highlight ? "text-[#FBF5E0]/60" : "text-[#5C3A1E]/60"}`}>
                    {description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-4xl font-bold ${plan.highlight ? "text-[#FBF5E0]" : "text-[#2C1A0E]"}`}
                      style={{ fontFamily: "'Fraunces', serif" }}
                    >
                      {price}
                    </span>
                    {period && (
                      <span className={`text-sm ${plan.highlight ? "text-[#FBF5E0]/50" : "text-[#5C3A1E]/50"}`}>
                        {period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${plan.color}20` }}
                      >
                        <Check className="w-3 h-3" style={{ color: plan.color }} strokeWidth={2.5} />
                      </div>
                      <span className={`text-sm ${plan.highlight ? "text-[#FBF5E0]/80" : "text-[#5C3A1E]/80"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => toast(`${name} ${t("pricing.toast_soon")}`)}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 active:scale-95 ${
                    plan.highlight
                      ? "bg-[#D06224] text-[#FBF5E0] hover:bg-[#AE431E]"
                      : "border-2 hover:bg-opacity-10"
                  }`}
                  style={
                    !plan.highlight
                      ? { borderColor: plan.color, color: plan.color, background: "transparent" }
                      : { boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }
                  }
                >
                  {cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}