import { useEffect, useRef, useState } from "react";

const stats = [
  {
    value: 75.6,
    suffix: "M+",
    label: "Trabajadoras domésticas",
    description: "en el mundo según la OIT",
  },
  {
    value: 18,
    suffix: "M",
    label: "Solo en América Latina",
    description: "con 80% en informalidad",
  },
  {
    value: 160,
    suffix: "K+",
    label: "En Costa Rica",
    description: "punto de entrada ideal",
  },
  {
    value: 3,
    suffix: " idiomas",
    label: "Multiidioma",
    description: "Español, inglés y francés",
  },
];

function useCountUp(target, duration, active) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(parseFloat(start.toFixed(1)));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

function StatCard({ stat, active }) {
  const count = useCountUp(stat.value, 1800, active);
  return (
    <div className="text-center group">
      <div
        className="text-5xl md:text-6xl font-bold text-[#FBF5E0] mb-2"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        {stat.value % 1 !== 0 ? count.toFixed(1) : Math.floor(count)}
        <span className="text-[#D06224]">{stat.suffix}</span>
      </div>
      <p className="text-lg font-semibold text-[#FBF5E0] mb-1">{stat.label}</p>
      <p className="text-sm text-[#FBF5E0]/60">{stat.description}</p>
    </div>
  );
}

export default function StatsSection() {
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #2C1A0E 0%, #5C3A1E 50%, #AE431E 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #D06224 0%, transparent 70%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-48 h-48 opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, #8A8635 0%, transparent 70%)",
          borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
        }}
      />

      <div className="container relative z-10">
        <div className="text-center mb-14">
          <p className="text-[#D06224] font-semibold text-sm tracking-widest uppercase mb-3">
            El mercado
          </p>
          <h2
            className="text-4xl md:text-5xl font-bold text-[#FBF5E0]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Un mercado enorme,{" "}
            <span className="italic text-[#D06224]">sin solución</span>
          </h2>
          <p className="text-[#FBF5E0]/60 mt-4 max-w-xl mx-auto text-lg">
            El empleo doméstico es uno de los sectores más grandes y menos
            formalizados del mundo.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
