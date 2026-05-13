import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../context/AuthContext";

const typeIcon = {
  attendance_approve: "",
  attendance_reject:  "",
  attendance_justify: "",
  attendance_observe: "",
  application:        "",
};

export default function NotificationBell() {
  const { token } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(token);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al click fuera
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("es-CR", { day: "2-digit", month: "short" }) +
      " " + d.toLocaleTimeString("es-CR", { hour: "2-digit", minute: "2-digit" });
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
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ backgroundColor: "#D06224" }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl z-50 overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#D0622215]">
            <h3 className="font-bold text-[#2C1A0E] text-sm">Notificaciones</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#D06224] hover:opacity-70 transition-opacity">
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
              notifications.map(n => (
                <div key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className="flex gap-3 px-4 py-3 border-b border-[#D0622208] cursor-pointer hover:bg-[#FBF5E0]/60 transition-colors"
                  style={{ backgroundColor: n.read ? "transparent" : "#FFF8F0" }}>
                  <span className="text-lg flex-shrink-0">{typeIcon[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#2C1A0E]">{n.title}</p>
                    <p className="text-xs text-[#5C3A1E]/70 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-[#5C3A1E]/40 mt-1">{formatDate(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: "#D06224" }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}