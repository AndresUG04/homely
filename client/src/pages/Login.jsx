import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Home,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  Star,
  CheckCircle,
} from "lucide-react";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    if (error) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
    } else {
      navigate("/dashboard");
    }
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
        {/* Panel izquierdo - formulario */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-10 py-12">
          {/* Logo */}
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

          {/* Título */}
          <h1
            className="text-3xl font-bold text-[#2C1A0E] mb-1"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            Bienvenido de vuelta
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mb-8">
            Iniciá sesión para continuar gestionando tu hogar
          </p>

          {/* Error */}
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

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-5 w-full">
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
                  style={{
                    border: "2px solid #D0622220",
                    backgroundColor: "#FBF5E0",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                />
              </div>
            </div>

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
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    border: "2px solid #D0622220",
                    backgroundColor: "#FBF5E0",
                  }}
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
                "Ingresando..."
              ) : (
                <>
                  Iniciar sesión <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-sm text-center mt-8 text-[#5C3A1E]/60">
            ¿No tenés cuenta?{" "}
            <Link
              to="/register"
              className="font-semibold hover:underline"
              style={{ color: "#D06224" }}
            >
              Registrate gratis
            </Link>
          </p>
        </div>

        {/* Panel derecho - imagen con overlay */}
        <div className="hidden md:flex w-1/2 relative overflow-hidden">
          {/* Imagen de fondo */}
          <img
            src="/src/assets/login-bg2.jpg"
            alt="Homely"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Overlay degradado */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #D06224CC 0%, #AE431ECC 60%, #8C3515DD 100%)",
            }}
          />

          {/* Blobs decorativos */}
          <div
            className="absolute top-0 right-0 w-64 h-64 opacity-15 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #FBF5E0 0%, transparent 70%)",
              borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
              transform: "translate(30%, -30%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 opacity-10 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, #8A8635 0%, transparent 70%)",
              borderRadius: "40% 60% 70% 30%",
              transform: "translate(-30%, 30%)",
            }}
          />

          {/* Contenido encima */}
          <div className="relative z-10 flex flex-col justify-center px-12 py-12">
            <h2
              className="text-4xl font-bold text-[#FBF5E0] mb-4 leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Tu hogar,
              <br />
              <span className="italic opacity-80">organizado.</span>
            </h2>
            <p className="text-[#FBF5E0]/70 text-base mb-10 leading-relaxed">
              Gestioná contratos, pagos y asistencia desde un solo lugar.
              Simple, transparente y digital.
            </p>

            <div className="space-y-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E0]/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-[#FBF5E0]" />
                </div>
                <div>
                  <p className="text-[#FBF5E0] font-semibold text-sm">
                    Asistencia confirmada
                  </p>
                  <p className="text-[#FBF5E0]/60 text-xs">
                    Entrada registrada: 8:00 AM
                  </p>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E0]/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#FBF5E0]" />
                </div>
                <div>
                  <p className="text-[#FBF5E0] font-semibold text-sm">
                    Perfil verificado
                  </p>
                  <p className="text-[#FBF5E0]/60 text-xs">
                    4 empleadores · 6 años de exp.
                  </p>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/20 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E0]/20 flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-[#FBF5E0]" />
                </div>
                <div>
                  <p className="text-[#FBF5E0] font-semibold text-sm">
                    Último pago recibido
                  </p>
                  <p className="text-[#FBF5E0]/60 text-xs">
                    ₡185,000 · Comprobante PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// import loginBg from "../assets/login-bg.jpg";

// function Login() {
//   return (
//     <div
//       className="min-h-screen w-full flex items-center justify-center p-6"
//       style={{ backgroundColor: "#D06224" }}
//     >
//       <div
//         className="w-11/12 rounded-3xl overflow-hidden flex"
//         style={{ minHeight: "520px" }}
//       >
//         {/* Panel izquierdo - formulario */}
//         <div
//           className="w-1/2 flex flex-col justify-center items-center text-center px-10 py-12"
//           style={{ backgroundColor: "#FBF5E0" }}
//         >
//           {/* Logo */}
//           <h1 className="text-3xl font-bold mb-1" style={{ color: "#AE431E" }}>
//             HogarPro
//           </h1>
//           <p className="text-sm mb-8" style={{ color: "#8A8635" }}>
//             Gestión del hogar, simplificada
//           </p>

//           {/* Título */}
//           <h2
//             className="text-xl font-semibold mb-6"
//             style={{ color: "#D06224" }}
//           >
//             Iniciá sesión en tu cuenta
//           </h2>

//           {/* Formulario */}
//           <form className="space-y-5 w-full">
//             <div>
//               <label
//                 className="block text-sm font-medium mb-1"
//                 style={{ color: "#AE431E" }}
//               >
//                 Correo electrónico
//               </label>
//               <input
//                 type="email"
//                 placeholder="correo@ejemplo.com"
//                 className="w-full px-4 py-3 rounded-xl text-sm outline-none"
//                 style={{ border: "1.5px solid #D0622440" }}
//               />
//             </div>

//             <div>
//               <label
//                 className="block text-sm font-medium mb-1"
//                 style={{ color: "#AE431E" }}
//               >
//                 Contraseña
//               </label>
//               <input
//                 type="password"
//                 placeholder="••••••••"
//                 className="w-full px-4 py-3 rounded-xl text-sm outline-none"
//                 style={{ border: "1.5px solid #D0622440" }}
//               />
//             </div>

//             <button
//               type="submit"
//               className="w-full py-3 rounded-xl text-white font-semibold text-sm"
//               style={{ backgroundColor: "#D06224" }}
//             >
//               Iniciar sesión
//             </button>
//           </form>

//           {/* Registro */}
//           <p className="text-sm text-center mt-6" style={{ color: "#AE431E" }}>
//             ¿No tenés cuenta?{" "}
//             <a
//               href="/register"
//               className="font-semibold hover:underline"
//               style={{ color: "#D06224" }}
//             >
//               Registrate
//             </a>
//           </p>
//         </div>

//         {/* Panel derecho - imagen */}
//         <div className="w-1/2 relative">
//           <img
//             src={loginBg}
//             alt="Homely Login Background"
//             className="absolute inset-0 w-full h-full object-cover"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Login;
