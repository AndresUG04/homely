import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../context/AuthContext";

const typeIcon = {
  // Asistencias
  attendance_approve:   "✅",
  attendance_reject:    "❌",
  attendance_justify:   "📝",
  attendance_observe:   "💬",
  // Tareas
  task_assigned:        "📋",
  task_deleted:         "🗑️",
  task_status_updated:  "🔄",
  // Contratos
  contract_created:     "📄",
  contract_accepted:    "🤝",
  contract_rejected:    "🚫",
  contract_finished:    "🏁",
  contract_signed:      "✍️",
  // Invitaciones
  invitation_received:  "📨",
  invitation_accepted:  "🎉",
  invitation_rejected:  "↩️",
  // Ofertas/Aplicaciones
  application_received: "💼",
  application_accepted: "✨",
  application_rejected: "↩️",
  // Pagos
  payment_received:     "💰",
  payment_pending:      "⏳",
  // Referencias
  reference_received:   "⭐",
  reference_request:    "🙋",
};

// Mapea tipo de notificación → ruta del frontend
const getRoute = (type, referenceId, userRole) => {
  if (!type) return null;

  if (type.startsWith("attendance_"))
    return `/attendance`; // referenceId es un attendance.id, no contractId

  if (type.startsWith("task_")) {
    if (userRole === "employer") return `/dashboard/tareas`;
    return `/dashboard/mis-tareas`;
  }

  if (type.startsWith("contract_"))
    return referenceId ? `/contracts/${referenceId}/review` : `/contracts`;

  if (type.startsWith("invitation_"))
    return `/jobs/invitations`;

  if (type.startsWith("application_"))
    return `/jobs/mine`;

  if (type.startsWith("payment_"))
    return referenceId ? `/payments/${referenceId}` : `/dashboard/payments`;

  if (type.startsWith("reference_"))
    return `/dashboard/profile`;

  return null;
};

export default function NotificationBell() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(token);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("es-CR", { day: "2-digit", month: "short" }) +
      " " +
      d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleNotificationClick = async (n) => {
    if (!n.read) await markAsRead(n.id);
    const route = getRoute(n.type, n.reference_id, user?.role);
    if (route) {
      setOpen(false);
      navigate(route);
    }
  };

  return (
    <div className="relative" ref={ref}>
      {/* Botón campanita */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-[#2C1A0E]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: "#D06224" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-2xl z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D0622215]">
            <h3 className="font-bold text-[#2C1A0E] text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#D06224] hover:opacity-70 transition-opacity"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#5C3A1E]/40">
                <Bell className="w-8 h-8 mb-2" />
                <p className="text-xs">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => {
                const hasRoute = !!getRoute(n.type, n.reference_id, user?.role);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex gap-3 px-4 py-3 border-b border-[#D0622208] transition-colors
                      ${hasRoute ? "cursor-pointer hover:bg-[#FBF5E0]/60" : "cursor-default"}`}
                    style={{ backgroundColor: n.read ? "transparent" : "#FFF8F0" }}
                  >
                    <span className="text-lg flex-shrink-0">
                      {typeIcon[n.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#2C1A0E]">{n.title}</p>
                      <p className="text-xs text-[#5C3A1E]/70 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <p className="text-xs text-[#5C3A1E]/40 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                    {!n.read && (
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: "#D06224" }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}