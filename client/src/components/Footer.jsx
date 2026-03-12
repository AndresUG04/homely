import { Home, Globe, Mail, Twitter, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";

const footerLinks = {
  producto: [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "¿Cómo funciona?", href: "#como-funciona" },
    { label: "Planes y precios", href: "#planes" },
    { label: "Seguridad", href: "#" },
  ],
  empleadores: [
    { label: "Crear contrato", href: "#" },
    { label: "Control de asistencia", href: "#" },
    { label: "Dashboard financiero", href: "#" },
    { label: "Reportes PDF", href: "#" },
  ],
  trabajadoras: [
    { label: "Perfil laboral portátil", href: "#" },
    { label: "Historial de pagos", href: "#" },
    { label: "Referencias verificadas", href: "#" },
    { label: "Mis beneficios", href: "#" },
  ],
  empresa: [
    { label: "Acerca de Homely", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Prensa", href: "#" },
    { label: "Contacto", href: "#" },
  ],
};

export default function Footer() {
  const handleLink = (e, label) => {
    const href = e.currentTarget.getAttribute("href");
    if (href && href.startsWith("#") && href.length > 1) {
      const el = document.querySelector(href);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    if (href === "#") {
      e.preventDefault();
      toast(`"${label}" — próximamente disponible.`);
    }
  };

  return (
    <footer style={{ background: "#1A0F06" }}>
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <a href="#inicio" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-[#D06224] flex items-center justify-center">
                <Home className="w-5 h-5 text-[#FBF5E0]" strokeWidth={2} />
              </div>
              <span
                className="text-2xl font-bold text-[#FBF5E0]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                Homely
              </span>
            </a>
            <p className="text-[#FBF5E0]/50 text-sm leading-relaxed mb-6 max-w-xs">
              Digitalizamos y formalizamos la relación laboral entre empleadores
              y trabajadoras domésticas en cualquier parte del mundo.
            </p>

            {/* Language selector */}
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-4 h-4 text-[#D06224]" />
              <select
                className="bg-transparent text-[#FBF5E0]/60 text-sm border-none outline-none cursor-pointer"
                onChange={() =>
                  toast("Cambio de idioma — próximamente disponible.")
                }
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Instagram, label: "Instagram" },
                { icon: Linkedin, label: "LinkedIn" },
                { icon: Mail, label: "Email" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  onClick={() => toast(`${label} — próximamente disponible.`)}
                  className="w-9 h-9 rounded-lg bg-[#FBF5E0]/8 flex items-center justify-center text-[#FBF5E0]/50 hover:text-[#D06224] hover:bg-[#D06224]/15 transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[#FBF5E0] font-semibold text-sm mb-4 capitalize">
                {category === "producto"
                  ? "Producto"
                  : category === "empleadores"
                    ? "Empleadores"
                    : category === "trabajadoras"
                      ? "Trabajadoras"
                      : "Empresa"}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLink(e, link.label)}
                      className="text-sm text-[#FBF5E0]/45 hover:text-[#D06224] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#FBF5E0]/8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#FBF5E0]/30 text-sm">
            © 2026 Homely. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            {["Privacidad", "Términos", "Cookies"].map((item) => (
              <button
                key={item}
                onClick={() => toast(`${item} — próximamente disponible.`)}
                className="text-sm text-[#FBF5E0]/30 hover:text-[#D06224] transition-colors duration-200"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
