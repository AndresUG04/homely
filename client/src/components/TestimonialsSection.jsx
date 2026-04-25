import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Star, MapPin } from "lucide-react";

const avatarColors = ["#D06224", "#8A8635", "#AE431E", "#D06224"];

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const cardsRef = useRef([]);

  const testimonials = t("testimonials.items", { returnObjects: true });

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
    <section id="testimonios" className="py-24" style={{ background: "#F0E8C8" }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#8A8635] font-semibold text-sm tracking-widest uppercase mb-3">
            {t("testimonials.label")}
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("testimonials.titulo")}{" "}
            <span className="text-[#D06224] italic">{t("testimonials.titulo_span")}</span>
          </h2>
          <p className="text-[#5C3A1E]/70 text-lg max-w-xl mx-auto">
            {t("testimonials.descripcion")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t_item, i) => {
            const avatarColor = avatarColors[i % avatarColors.length];
            const avatar = t_item.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

            return (
              <div
                key={t_item.name}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="relative bg-white rounded-3xl p-8 group hover:-translate-y-1 transition-transform duration-300"
                style={{
                  opacity: 0,
                  transform: "translateY(0px)",
                  transition: "opacity 0.6s ease-out, transform 0.6s ease-out, translate 0.3s",
                  boxShadow: "0 4px 20px rgba(208,98,36,0.08)",
                }}
              >
                {/* Quote mark */}
                <div
                  className="absolute top-6 right-8 text-7xl font-bold leading-none pointer-events-none select-none"
                  style={{ color: `${avatarColor}15`, fontFamily: "'Fraunces', serif" }}
                >
                  "
                </div>

                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#D06224] text-[#D06224]" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-[#5C3A1E]/80 leading-relaxed mb-6 text-base relative z-10">
                  "{t_item.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[#FBF5E0] font-bold text-sm flex-shrink-0"
                    style={{ background: avatarColor }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2C1A0E] text-sm">{t_item.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: `${avatarColor}15`, color: avatarColor }}
                      >
                        {t_item.role}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-[#5C3A1E]/50">
                        <MapPin className="w-3 h-3" />
                        {t_item.location}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}