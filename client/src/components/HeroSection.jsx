import { useEffect, useRef } from "react";
import { ArrowRight, Shield, Globe, Star } from "lucide-react";
import { toast } from "sonner";

export default function HeroSection() {
  const heroRef = useRef(null);

  useEffect(() => {
    const elements = heroRef.current?.querySelectorAll(".hero-animate");
    elements?.forEach((el, i) => {
      setTimeout(
        () => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        },
        150 + i * 120,
      );
    });
  }, []);

  return (
    <section
      id="inicio"
      ref={heroRef}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#FBF5E0] pt-20"
    >
      {/* Background blob decorations */}
      <div
        className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #D06224 0%, transparent 70%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />
      <div
        className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] opacity-8 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #8A8635 0%, transparent 70%)",
          borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
        }}
      />

      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-8 items-center min-h-[calc(100vh-5rem)] py-12 lg:py-0">
          {/* Left: Text content */}
          <div className="space-y-8">
            {/* Badge */}
            <div
              className="hero-animate inline-flex items-center gap-2 bg-[#8A8635]/12 border border-[#8A8635]/25 text-[#6B6828] text-sm font-semibold px-4 py-2 rounded-full"
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                transition: "all 0.7s ease-out",
              }}
            >
              <Globe className="w-4 h-4" />
              Plataforma global para el empleo doméstico
            </div>

            {/* Headline */}
            <div
              className="hero-animate space-y-2"
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                transition: "all 0.7s ease-out",
              }}
            >
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                El hogar,{" "}
                <span className="text-[#D06224] italic">formalizado</span>
                <br />
                en un clic.
              </h1>
            </div>

            {/* Subtext */}
            <p
              className="hero-animate text-lg md:text-xl text-[#5C3A1E]/80 leading-relaxed max-w-xl"
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                transition: "all 0.7s ease-out",
              }}
            >
              Homely digitaliza y formaliza la relación laboral entre
              empleadores y trabajadoras domésticas. Contratos, pagos,
              asistencia y perfil laboral portátil — todo en un solo lugar, en
              cualquier país.
            </p>

            {/* CTA buttons */}
            <div
              className="hero-animate flex flex-col sm:flex-row gap-4"
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                transition: "all 0.7s ease-out",
              }}
            >
              <button
                onClick={() => toast("Registro — próximamente disponible.")}
                className="group flex items-center justify-center gap-2 bg-[#D06224] hover:bg-[#AE431E] text-[#FBF5E0] font-semibold text-base px-7 py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ boxShadow: "0 8px 32px rgba(208,98,36,0.35)" }}
              >
                Comenzar gratis
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector("#como-funciona");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center justify-center gap-2 border-2 border-[#D06224]/30 text-[#D06224] font-semibold text-base px-7 py-4 rounded-xl hover:border-[#D06224] hover:bg-[#D06224]/8 transition-all duration-300"
              >
                Ver cómo funciona
              </button>
            </div>

            {/* Trust signals */}
            <div
              className="hero-animate flex flex-wrap items-center gap-6 pt-2"
              style={{
                opacity: 0,
                transform: "translateY(20px)",
                transition: "all 0.7s ease-out",
              }}
            >
              <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/70">
                <Shield className="w-4 h-4 text-[#8A8635]" />
                <span>Contrato digital seguro</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/70">
                <Globe className="w-4 h-4 text-[#8A8635]" />
                <span>Disponible en 3 idiomas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/70">
                <Star className="w-4 h-4 text-[#D06224]" />
                <span>Perfil laboral portátil</span>
              </div>
            </div>
          </div>

          {/* Right: Visual */}
          <div
            className="hero-animate relative flex justify-center lg:justify-end"
            style={{
              opacity: 0,
              transform: "translateY(20px)",
              transition: "all 0.7s ease-out",
            }}
          >
            {/* Main image */}
            <div className="relative">
              <div
                className="w-full max-w-md lg:max-w-lg rounded-3xl overflow-hidden"
                style={{
                  boxShadow:
                    "0 24px 80px rgba(174,67,30,0.22), 0 8px 24px rgba(208,98,36,0.15)",
                }}
              >
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663418597851/9JwqepjoByGTkBDVWtkWA5/homely-hero-PDRAg8wiTS4nUswx6tT5Zh.webp"
                  alt="Empleadora gestionando su hogar con Homely"
                  className="w-full h-auto object-cover"
                  style={{ aspectRatio: "3/2" }}
                />
              </div>

              {/* Floating card: Asistencia */}
              <div
                className="absolute -left-6 top-1/4 bg-white rounded-2xl px-4 py-3 shadow-warm-lg border border-[#D06224]/10 min-w-[160px]"
                style={{ animation: "float 4s ease-in-out infinite" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#8A8635]" />
                  <span className="text-xs font-semibold text-[#5C3A1E]">
                    Asistencia hoy
                  </span>
                </div>
                <p
                  className="text-2xl font-bold text-[#D06224]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  ✓ Confirmada
                </p>
                <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
                  Entrada: 8:00 AM
                </p>
              </div>

              {/* Floating card: Pago */}
              <div
                className="absolute -right-4 bottom-1/4 bg-white rounded-2xl px-4 py-3 shadow-warm-lg border border-[#D06224]/10 min-w-[150px]"
                style={{ animation: "float 4s ease-in-out infinite 2s" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#D06224]" />
                  <span className="text-xs font-semibold text-[#5C3A1E]">
                    Último pago
                  </span>
                </div>
                <p
                  className="text-2xl font-bold text-[#2C1A0E]"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  ₡185,000
                </p>
                <p className="text-xs text-[#8A8635] mt-0.5 font-medium">
                  Comprobante PDF ↓
                </p>
              </div>

              {/* Floating card: Rating */}
              <div
                className="absolute -top-4 right-8 bg-[#AE431E] rounded-2xl px-4 py-3 shadow-warm-lg min-w-[130px]"
                style={{ animation: "float 4s ease-in-out infinite 1s" }}
              >
                <p className="text-xs font-semibold text-[#FBF5E0]/80 mb-1">
                  Perfil verificado
                </p>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-[#FBF5E0] fill-[#FBF5E0]"
                    />
                  ))}
                </div>
                <p className="text-xs text-[#FBF5E0]/70 mt-1">3 empleadores</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
        <div
          className="w-px h-12 bg-[#D06224]"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
        <span className="text-xs text-[#D06224] font-medium tracking-widest uppercase">
          Scroll
        </span>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  );
}
