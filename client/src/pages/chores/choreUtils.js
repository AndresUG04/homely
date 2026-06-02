export const STATUS_CONFIG = {
  pending:     { label: "Pendiente",  className: "bg-gray-100 text-gray-600" },
  in_progress: { label: "En progreso", className: "bg-[#D06224]/10 text-[#D06224]" },
  completed:   { label: "Completada", className: "bg-green-100 text-green-700" },
};

export function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : "—";
}
