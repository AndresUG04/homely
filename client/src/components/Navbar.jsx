import { useState, useEffect } from "react";
import { Menu, X, Home } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Funcionalidades", href: "#funcionalidades" },
  { label: "¿Cómo funciona?", href: "#como-funciona" },
  { label: "Planes", href: "#planes" },
  { label: "Testimonios", href: "#testimonios" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleComingSoon = (e, label) => {
    e.preventDefault();

    const anchor = e.currentTarget.getAttribute("href");

    if (anchor && anchor.startsWith("#")) {
      const el = document.querySelector(anchor);

      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        setMobileOpen(false);
        return;
      }
    }

    toast(`"${label}" — próximamente disponible.`);
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#FBF5E0]/90 backdrop-blur-md shadow-warm border-b border-[#D06224]/10"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#D06224] flex items-center justify-center shadow-warm transition-transform duration-300 group-hover:scale-105">
              <Home className="w-5 h-5 text-[#FBF5E0]" strokeWidth={2} />
            </div>
            <span
              className="text-2xl font-bold text-[#2C1A0E]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Homely
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleComingSoon(e, link.label)}
                className="text-sm font-medium text-[#5C3A1E] hover:text-[#D06224] transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[#D06224] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-[#D06224] hover:text-[#AE431E] transition-colors duration-200 px-4 py-2"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate("/register")}
              className="text-sm font-semibold text-[#FBF5E0] bg-[#D06224] hover:bg-[#AE431E] transition-all duration-300 px-5 py-2.5 rounded-xl shadow-warm hover:shadow-warm-lg hover:scale-105 active:scale-95"
            >
              Comenzar gratis
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#5C3A1E] hover:bg-[#D06224]/10 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menú"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#FBF5E0]/95 backdrop-blur-md border-t border-[#D06224]/10 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleComingSoon(e, link.label)}
              className="block px-4 py-3 text-sm font-medium text-[#5C3A1E] hover:text-[#D06224] hover:bg-[#D06224]/8 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 flex flex-col gap-2">
            <button
              onClick={() => {
                navigate("/login");
                setmovileOpen(false);
              }}
              className="w-full text-sm font-semibold text-[#D06224] border border-[#D06224] py-2.5 rounded-xl hover:bg-[#D06224]/8 transition-colors"
            >
              Iniciar sesión
            </button>

            <button
              onClick={() => {
                navigate("/register");
                setMobileOpen(false);
              }}
              className="w-full text-sm font-semibold text-[#FBF5E0] bg-[#D06224] py-2.5 rounded-xl hover:bg-[#AE431E] transition-colors"
            >
              Comenzar gratis
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
