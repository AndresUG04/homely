import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Star, MapPin, CheckCircle, Award } from "lucide-react";
import { toast } from "sonner";

export default function PortableProfileSection() {
  const { t } = useTranslation();
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const items = [
    { icon: CheckCircle, text: t("profile.items.referencias"), color: "#8A8635" },
    { icon: Star,        text: t("profile.items.calificaciones"), color: "#D06224" },
    { icon: MapPin,      text: t("profile.items.paises"), color: "#D06224" },
    { icon: Award,       text: t("profile.items.acceso"), color: "#8A8635" },
  ];

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
      { threshold: 0.2 },
    );
    if (leftRef.current) observer.observe(leftRef.current);
    if (rightRef.current) observer.observe(rightRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A0F06 0%, #3D1F0D 40%, #5C3A1E 100%)" }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 left-0 w-96 h-96 opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #D06224 0%, transparent 70%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          transform: "translate(-30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #8A8635 0%, transparent 70%)",
          borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
          transform: "translate(30%, 30%)",
        }}
      />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Images */}
          <div
            ref={leftRef}
            className="relative flex justify-center"
            style={{ opacity: 0, transform: "translateY(30px)", transition: "all 0.8s ease-out" }}
          >
            <div className="relative">
              <div
                className="w-72 h-96 rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}
              >
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663418597851/9JwqepjoByGTkBDVWtkWA5/homely-worker-ig7wTm7FQ3gg8NSpfGZRjX.webp"
                  alt="Trabajadora doméstica con perfil verificado en Homely"
                  className="w-full h-full object-cover"
                />
              </div>

              <div
                className="absolute -right-12 -top-8 w-36 h-36 rounded-2xl overflow-hidden"
                style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
              >
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663418597851/9JwqepjoByGTkBDVWtkWA5/homely-globe-3QJT6Ng4wmPCL4jCZcLGHw.webp"
                  alt="Alcance global de Homely"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Profile card overlay */}
              <div
                className="absolute -left-8 bottom-8 bg-[#FBF5E0] rounded-2xl p-4 min-w-[200px]"
                style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#D06224] flex items-center justify-center">
                    <span className="text-[#FBF5E0] font-bold text-sm">MR</span>
                  </div>
                  <div>
                    <p className="font-bold text-[#2C1A0E] text-sm">{t("profile.card_nombre")}</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#8A8635]" />
                      <span className="text-xs text-[#5C3A1E]/60">{t("profile.card_ubicacion")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-[#D06224] fill-[#D06224]" />
                  ))}
                  <span className="text-xs text-[#5C3A1E] ml-1 font-medium">5.0</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#8A8635]" />
                  <span className="text-xs text-[#8A8635] font-semibold">{t("profile.card_verificado")}</span>
                </div>
                <p className="text-xs text-[#5C3A1E]/50 mt-1">{t("profile.card_experiencia")}</p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div
            ref={rightRef}
            className="space-y-8"
            style={{ opacity: 0, transform: "translateY(30px)", transition: "all 0.8s ease-out 0.2s" }}
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-[#D06224]/20 border border-[#D06224]/30 text-[#D06224] text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Award className="w-4 h-4" />
                {t("profile.badge")}
              </div>
              <h2
                className="text-4xl md:text-5xl font-bold text-[#FBF5E0] mb-4 leading-tight"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {t("profile.titulo")}{" "}
                <span className="text-[#D06224] italic">{t("profile.titulo_span")}</span>
              </h2>
              <p className="text-[#FBF5E0]/70 text-lg leading-relaxed">
                {t("profile.descripcion")}{" "}
                <strong className="text-[#FBF5E0]">{t("profile.descripcion_strong")}</strong>.
              </p>
            </div>

            <div className="space-y-4">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${item.color}20` }}
                  >
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <p className="text-[#FBF5E0]/80 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => toast(t("profile.toast"))}
              className="inline-flex items-center gap-2 bg-[#D06224] hover:bg-[#AE431E] text-[#FBF5E0] font-semibold px-7 py-4 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ boxShadow: "0 8px 32px rgba(208,98,36,0.4)" }}
            >
              {t("profile.btn")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}