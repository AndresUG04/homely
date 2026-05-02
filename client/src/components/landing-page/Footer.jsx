import { Home, Globe, Mail, Twitter, Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import "../../i18n";

export default function Footer() {
  const { t,i18n} = useTranslation();
  const footerLinks = {
    producto: [
      { labelKey: "footer.links.funcionalidades", href: "#funcionalidades" },
      { labelKey: "footer.links.como_funciona", href: "#como-funciona" },
      { labelKey: "footer.links.planes", href: "#planes" },
      { labelKey: "footer.links.seguridad", href: "#" },
    ],
    empleadores: [
      { labelKey: "footer.links.crear_contrato", href: "#" },
      { labelKey: "footer.links.asistencia", href: "#" },
      { labelKey: "footer.links.dashboard", href: "#" },
      { labelKey: "footer.links.reportes", href: "#" },
    ],
    trabajadoras: [
      { labelKey: "footer.links.perfil", href: "#" },
      { labelKey: "footer.links.historial", href: "#" },
      { labelKey: "footer.links.referencias", href: "#" },
      { labelKey: "footer.links.beneficios", href: "#" },
    ],
    empresa: [
      { labelKey: "footer.links.acerca", href: "#" },
      { labelKey: "footer.links.blog", href: "#" },
      { labelKey: "footer.links.prensa", href: "#" },
      { labelKey: "footer.links.contacto", href: "#" },
    ],
};
  const handleLink = (e, labelkey) => {
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
      toast(`"${t(labelkey)}"${t("footer.toast_soon")}`);
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
                           {t("footer.descripcion")}
            </p>

            {/* Language selector */}
                <div className="flex items-center gap-2 mb-6">
                  <Globe className="w-4 h-4 text-[#D06224]" />
                  <select
                    value={i18n.language.split("-")[0]}
                    className="bg-transparent text-[#FBF5E0]/60 text-sm border-none outline-none cursor-pointer"
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="es" style={{ background: "#1A0F06", color: "#FBF5E0" }}>Español</option>
                    <option value="en" style={{ background: "#1A0F06", color: "#FBF5E0" }}>English</option>
                    <option value="fr" style={{ background: "#1A0F06", color: "#FBF5E0" }}>Français</option>
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
                  onClick={() => toast(`${label} ${t("footer.toast_soon")}`)}
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
                      {t(`footer.categoria.${category}`)}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.labelkey}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLink(e, link.labelKey)}
                      className="text-sm text-[#FBF5E0]/45 hover:text-[#D06224] transition-colors duration-200"
                    >
                     {t(link.labelKey)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#FBF5E0]/8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#FBF5E0]/30 text-sm">{t("footer.rights")}</p>
          <div className="flex gap-6">
            {["privacidad", "terminos", "cookies"].map((key) => (
              <button
                key={key}
                onClick={() => toast(`${t(`footer.${key}`)} ${t("footer.toast_soon")}`)}
                className="text-sm text-[#FBF5E0]/30 hover:text-[#D06224] transition-colors duration-200"
              >
                {t(`footer.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
