import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Paperclip } from "lucide-react";

const statusColor = {
  "Puntual":                "#22A05B",
  "Tardía":                 "#E8A800",
  "Salida Anticipada":      "#E8A800",
  "Ausencia":               "#E52929",
  "Asistencia Justificada": "#22A05B",
  "Marcas Irregulares":     "#E52929",
};

const ALL_STATUSES = [
  "Puntual", "Tardía", "Salida Anticipada",
  "Ausencia", "Asistencia Justificada", "Marcas Irregulares",
];

export default function AttendanceRecordsTable({ records, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "fr" ? "fr-FR" : i18n.language === "en" ? "en-US" : "es-CR";

  const [filterFrom,   setFilterFrom]   = useState("");
  const [filterTo,     setFilterTo]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filtered = useMemo(() => {
    return records.filter(r => {
      const date = new Date(r.work_date);
      if (filterFrom   && date < new Date(filterFrom))             return false;
      if (filterTo     && date > new Date(filterTo + "T23:59:59")) return false;
      if (filterStatus && r.status !== filterStatus)               return false;
      return true;
    }).sort((a, b) => new Date(b.work_date) - new Date(a.work_date));
  }, [records, filterFrom, filterTo, filterStatus]);

  const formatTime = (ts) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    return new Date(ts).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
  };

  const renderJustification = (justification) => {
    if (!justification) return <span className="text-[#5C3A1E]/40">—</span>;

    const adjIdx = justification.indexOf("[Adjunto]:");
    const text   = adjIdx === -1 ? justification.trim() : justification.slice(0, adjIdx).trim();
    const url    = adjIdx !== -1 ? justification.slice(adjIdx + "[Adjunto]:".length).trim() : null;

    return (
      <div className="flex flex-col gap-1">
        {text && (
          <span className="text-[#5C3A1E]/70 text-xs">{text}</span>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-white w-fit hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#D06224" }}>
            <Paperclip className="w-3 h-3" />
            {t("attendanceDetail.records_table.justification_attachment")}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>

        <div className="flex items-center justify-between p-6 border-b border-[#D0622215]">
          <h2 className="text-2xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("attendanceDetail.records_table.title")}
          </h2>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#FBF5E0] flex items-center justify-center hover:bg-[#D06224]/10 transition-colors">
            <X className="w-5 h-5 text-[#2C1A0E]" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 p-5 border-b border-[#D0622210]">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5C3A1E]/60 font-medium">
              {t("attendanceDetail.records_table.filter_from")}
            </label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="rounded-xl border border-[#D0622230] px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#D06224]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5C3A1E]/60 font-medium">
              {t("attendanceDetail.records_table.filter_to")}
            </label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="rounded-xl border border-[#D0622230] px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#D06224]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#5C3A1E]/60 font-medium">
              {t("attendanceDetail.records_table.filter_status")}
            </label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="rounded-xl border border-[#D0622230] px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#D06224] bg-white">
              <option value="">{t("attendanceDetail.records_table.all_statuses")}</option>
              {ALL_STATUSES.map(s => (
                <option key={s} value={s}>{t(`attendanceDetail.status.${s}`)}</option>
              ))}
            </select>
          </div>
          {(filterFrom || filterTo || filterStatus) && (
            <div className="flex items-end">
              <button onClick={() => { setFilterFrom(""); setFilterTo(""); setFilterStatus(""); }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#D06224] border border-[#D0622230] hover:bg-[#D06224]/5 transition-colors">
                ✕ Reset
              </button>
            </div>
          )}
        </div>

        <div className="overflow-auto flex-1 p-5">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-[#5C3A1E]/50">
              {t("attendanceDetail.records_table.no_records")}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D0622215]">
                  {["col_date","col_checkin","col_checkout","col_status","col_justification"].map(col => (
                    <th key={col} className="text-left py-3 px-3 text-xs font-semibold text-[#5C3A1E]/60 uppercase tracking-wide">
                      {t(`attendanceDetail.records_table.${col}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b border-[#D0622208] hover:bg-[#FBF5E0]/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-[#2C1A0E]">{formatDate(r.work_date)}</td>
                    <td className="py-3 px-3 text-[#5C3A1E]">{formatTime(r.check_in)}</td>
                    <td className="py-3 px-3 text-[#5C3A1E]">{formatTime(r.check_out)}</td>
                    <td className="py-3 px-3">
                      {r.status ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-white"
                          style={{ backgroundColor: statusColor[r.status] || "#999" }}>
                          {t(`attendanceDetail.status.${r.status}`)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-3 max-w-[200px]">
                      {renderJustification(r.justification)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-[#D0622210] flex justify-between items-center">
          <span className="text-xs text-[#5C3A1E]/50">
            {filtered.length} {t("attendanceDetail.records_table.col_date").toLowerCase()}s
          </span>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#D06224" }}>
            {t("attendanceDetail.records_table.close")}
          </button>
        </div>
      </div>
    </div>
  );
}