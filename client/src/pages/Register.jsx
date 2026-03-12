import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Home,
  Mail,
  Lock,
  ArrowRight,
  User,
  Briefcase,
  Users,
} from "lucide-react";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Por favor seleccioná un rol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    if (error) {
      setError("Hubo un problema al crear tu cuenta. Intentá de nuevo.");
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
  };

  const inputStyle = {
    border: "2px solid #D0622220",
    backgroundColor: "#FBF5E0",
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #FBF5E0 0%, #F0E8C8 100%)",
      }}
    >
      <div
        className="w-11/12 rounded-3xl overflow-hidden flex"
        style={{
          minHeight: "580px",
          boxShadow: "0 24px 80px rgba(208,98,36,0.15)",
        }}
      >
        {/* Panel izquierdo - imagen */}
        <div className="hidden md:flex w-1/2 relative overflow-hidden">
          <img
            src="/src/assets/login-bg.jpg"
            alt="Homely"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #8A8635CC 0%, #6B6828CC 60%, #4A4A1EDD 100%)",
            }}
          />

          <div className="relative z-10 flex flex-col justify-center px-12 py-12">
            <h2
              className="text-4xl font-bold text-[#FBF5E0] mb-4 leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Empezá hoy,
              <br />
              <span className="italic opacity-80">es gratis.</span>
            </h2>
            <p className="text-[#FBF5E0]/70 text-base mb-10 leading-relaxed">
              Creá tu cuenta y formalizá la relación laboral de tu hogar en
              minutos.
            </p>

            <div className="space-y-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E0]/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-[#FBF5E0]" />
                </div>
                <div>
                  <p className="text-[#FBF5E0] font-semibold text-sm">
                    Para empleadores
                  </p>
                  <p className="text-[#FBF5E0]/60 text-xs">
                    Gestioná contratos, pagos y asistencia
                  </p>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E0]/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-[#FBF5E0]" />
                </div>
                <div>
                  <p className="text-[#FBF5E0] font-semibold text-sm">
                    Para trabajadoras
                  </p>
                  <p className="text-[#FBF5E0]/60 text-xs">
                    Perfil portátil y derechos protegidos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel derecho - formulario */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-10 py-12">
          <Link to="/" className="flex items-center gap-2.5 mb-8 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-[#D06224] flex items-center justify-center">
              <Home className="w-5 h-5 text-[#FBF5E0]" strokeWidth={2} />
            </div>
            <span
              className="text-2xl font-bold text-[#2C1A0E]"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Homely
            </span>
          </Link>

          <h1
            className="text-3xl font-bold text-[#2C1A0E] mb-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Creá tu cuenta
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mb-8">
            Gratis para comenzar, sin tarjeta de crédito
          </p>

          {error && (
            <div
              className="text-sm px-4 py-3 rounded-xl mb-6"
              style={{
                backgroundColor: "#AE431E15",
                color: "#AE431E",
                border: "1px solid #AE431E30",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 w-full">
            {/* Selector de rol */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#2C1A0E]">
                Soy...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("employer")}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor: role === "employer" ? "#D06224" : "#D0622220",
                    backgroundColor:
                      role === "employer" ? "#D0622210" : "#FBF5E0",
                  }}
                >
                  <Users
                    className="w-6 h-6"
                    style={{
                      color: role === "employer" ? "#D06224" : "#5C3A1E",
                    }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: role === "employer" ? "#D06224" : "#5C3A1E",
                    }}
                  >
                    Empleador
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("worker")}
                  className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor: role === "worker" ? "#8A8635" : "#D0622220",
                    backgroundColor:
                      role === "worker" ? "#8A863510" : "#FBF5E0",
                  }}
                >
                  <Briefcase
                    className="w-6 h-6"
                    style={{ color: role === "worker" ? "#8A8635" : "#5C3A1E" }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: role === "worker" ? "#8A8635" : "#5C3A1E" }}
                  >
                    Trabajadora
                  </span>
                </button>
              </div>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#2C1A0E]">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D06224]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#2C1A0E]">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D06224]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#2C1A0E]">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D06224]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                />
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-[#2C1A0E]">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D06224]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí tu contraseña"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: loading ? "#D0622480" : "#D06224",
                boxShadow: loading ? "none" : "0 8px 24px rgba(208,98,36,0.35)",
              }}
            >
              {loading ? (
                "Creando cuenta..."
              ) : (
                <>
                  Crear cuenta gratis <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-[#5C3A1E]/60">
            ¿Ya tenés cuenta?{" "}
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: "#D06224" }}
            >
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
