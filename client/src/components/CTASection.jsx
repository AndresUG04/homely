import { useEffect, useRef } from "react";
import { ArrowRight, Users, Briefcase } from "lucide-react";
import { toast } from "sonner";

export default function CTASection() {
  const contentRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && contentRef.current) {
          contentRef.current.style.opacity = "1";
          contentRef.current.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.2 },
    );
    if (contentRef.current) observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #D06224 0%, #AE431E 60%, #8C3515 100%)",
      }}
    >
      {/* Background decorations */}
      <div
        className="absolute top-0 right-0 w-96 h-96 opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #FBF5E0 0%, transparent 70%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-72 h-72 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #8A8635 0%, transparent 70%)",
          borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
          transform: "translate(-30%, 30%)",
        }}
      />

      {/* Contract image floating */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:block opacity-20 pointer-events-none">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663418597851/9JwqepjoByGTkBDVWtkWA5/homely-contract-Waanko9rWCWwbW3dpGsQwq.png"
          alt=""
          className="w-72 h-auto rounded-2xl"
          style={{ transform: "rotate(8deg)" }}
        />
      </div>

      <div className="container relative z-10">
        <div
          ref={contentRef}
          className="max-w-3xl"
          style={{
            opacity: 0,
            transform: "translateY(30px)",
            transition: "all 0.8s ease-out",
          }}
        >
          <p className="text-[#FBF5E0]/70 font-semibold text-sm tracking-widest uppercase mb-4">
            Únete a Homely
          </p>
          <h2
            className="text-4xl md:text-6xl font-bold text-[#FBF5E0] mb-6 leading-tight"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Formaliza tu hogar.
            <br />
            <span className="italic opacity-80">Empieza hoy.</span>
          </h2>
          <p className="text-[#FBF5E0]/75 text-xl mb-10 max-w-xl leading-relaxed">
            Sin importar si eres empleador o trabajadora doméstica, Homely tiene
            todo lo que necesitas para una relación laboral transparente, justa
            y digital.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() =>
                toast("Registro como empleador — próximamente disponible.")
              }
              className="group flex items-center justify-center gap-3 bg-[#FBF5E0] text-[#D06224] font-bold text-base px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:bg-white active:scale-95"
              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            >
              <Users className="w-5 h-5" />
              Soy empleador
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              onClick={() =>
                toast("Registro como trabajadora — próximamente disponible.")
              }
              className="group flex items-center justify-center gap-3 border-2 border-[#FBF5E0]/40 text-[#FBF5E0] font-bold text-base px-8 py-4 rounded-xl transition-all duration-300 hover:border-[#FBF5E0] hover:bg-[#FBF5E0]/10 active:scale-95"
            >
              <Briefcase className="w-5 h-5" />
              Soy trabajadora
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          <p className="text-[#FBF5E0]/50 text-sm mt-6">
            Gratis para comenzar · Sin tarjeta de crédito · Disponible en
            español, inglés y francés
          </p>
        </div>
      </div>
    </section>
  );
}
