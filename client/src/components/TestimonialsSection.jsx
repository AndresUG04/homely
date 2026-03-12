import { useEffect, useRef } from "react";
import { Star, MapPin } from "lucide-react";

const testimonials = [
  {
    name: "Claudia Méndez",
    role: "Empleadora",
    location: "San José, Costa Rica",
    avatar: "CM",
    avatarColor: "#D06224",
    rating: 5,
    text: "Antes tenía todo en un grupo de WhatsApp y siempre había malentendidos. Con Homely, mi trabajadora y yo vemos exactamente lo mismo. Cero conflictos desde que empezamos.",
  },
  {
    name: "Rosa Hernández",
    role: "Trabajadora doméstica",
    location: "Ciudad de México → Madrid",
    avatar: "RH",
    avatarColor: "#8A8635",
    rating: 5,
    text: "Cuando emigré a España, llevé mi perfil de Homely y mi nuevo empleador pudo ver todos mis años de trabajo verificados. Por primera vez, mi experiencia valió algo en otro país.",
  },
  {
    name: "Andrés Villalobos",
    role: "Empleador",
    location: "Guadalajara, México",
    avatar: "AV",
    avatarColor: "#AE431E",
    rating: 5,
    text: "El dashboard financiero me da una visión clara de todo lo que pago mensualmente. Los reportes PDF son perfectos para mi contabilidad. Una herramienta que debería existir desde hace años.",
  },
  {
    name: "Carmen Jiménez",
    role: "Trabajadora doméstica",
    location: "Bogotá, Colombia",
    avatar: "CJ",
    avatarColor: "#D06224",
    rating: 5,
    text: "Mis beneficios siempre estuvieron en la mente de mi empleador. Ahora los veo en tiempo real en mi teléfono. Homely me dio la seguridad que nunca había tenido en este trabajo.",
  },
];

export default function TestimonialsSection() {
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
    <section
      id="testimonios"
      className="py-24"
      style={{ background: "#F0E8C8" }}
    >
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[#8A8635] font-semibold text-sm tracking-widest uppercase mb-3">
            Testimonios
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Lo que dicen{" "}
            <span className="text-[#D06224] italic">quienes lo usan</span>
          </h2>
          <p className="text-[#5C3A1E]/70 text-lg max-w-xl mx-auto">
            Empleadores y trabajadoras en toda Latinoamérica ya están
            formalizando sus relaciones laborales con Homely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className="relative bg-white rounded-3xl p-8 group hover:-translate-y-1 transition-transform duration-300"
              style={{
                opacity: 0,
                transform: "translateY(30px)",
                transition:
                  "opacity 0.6s ease-out, transform 0.6s ease-out, translate 0.3s",
                boxShadow: "0 4px 20px rgba(208,98,36,0.08)",
              }}
            >
              {/* Quote mark */}
              <div
                className="absolute top-6 right-8 text-7xl font-bold leading-none pointer-events-none select-none"
                style={{
                  color: `${t.avatarColor}15`,
                  fontFamily: "'Fraunces', serif",
                }}
              >
                "
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="w-4 h-4 fill-[#D06224] text-[#D06224]"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-[#5C3A1E]/80 leading-relaxed mb-6 text-base relative z-10">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[#FBF5E0] font-bold text-sm flex-shrink-0"
                  style={{ background: t.avatarColor }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#2C1A0E] text-sm">
                    {t.name}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: `${t.avatarColor}15`,
                        color: t.avatarColor,
                      }}
                    >
                      {t.role}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-[#5C3A1E]/50">
                      <MapPin className="w-3 h-3" />
                      {t.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
