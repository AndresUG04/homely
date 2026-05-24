import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { Plus, Briefcase, MapPin, DollarSign, Clock, Calendar, Edit2, Trash2, Eye, ChevronRight } from "lucide-react";

const statusColors = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-red-50 text-red-700 border-red-200",
  expired: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatSchedule(schedule) {
  if (!schedule) return "—";
  if (!schedule.schedule_details || !schedule.schedule_details.length) return schedule.schedule_type || "—";
  return schedule.schedule_details
    .map(d => d.week_day + ": " + (d.start_time ? d.start_time.slice(0, 5) : "") + " - " + (d.end_time ? d.end_time.slice(0, 5) : ""))
    .join(", ");
}

function JobOfferCard({ job, onEdit, onDelete, onViewApplicants }) {
  const address = job.address;
  const location = address
    ? [address.city, address.state].filter(Boolean).join(", ") || "—"
    : "—";

  const salary = job.salary ? "₡" + job.salary.toLocaleString("es-CR") : "—";
  const status = job.status || "open";
  const statusLabel = status === "open" ? "Abierta" : status === "closed" ? "Cerrada" : status === "expired" ? "Expirada" : status;

  return (
    <div className="bg-white rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: "0 2px 16px rgba(44,26,14,0.06)" }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#2C1A0E] truncate">{job.title}</h3>
          <p className="text-sm text-[#5C3A1E]/70 mt-1 line-clamp-2">{job.description}</p>
        </div>
        <span className={"inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border " + (statusColors[status] || statusColors.open)}>
          {statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/60">
          <MapPin className="w-4 h-4 text-[#D06224]/60" />
          <span className="text-xs">{location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/60">
          <Clock className="w-4 h-4 text-[#D06224]/60" />
          <span className="text-xs">{formatSchedule(job.schedule)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSign className="w-4 h-4" style={{ color: "#D06224" }} />
          <span className="text-sm font-bold" style={{ color: "#D06224" }}>{salary}</span>
          <span className="text-xs text-[#5C3A1E]/50">/hora</span>
        </div>
      </div>

      {job.expiration_date && (
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/50 mb-4">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-xs">Expira: {new Date(job.expiration_date).toLocaleDateString("es-CR")}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-4 border-t border-[#D06224]/10">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onEdit(job.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[#D06224] bg-[#FBF5E0] hover:bg-[#D06224]/10 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={() => onDelete(job.id, job.title)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </button>
        </div>
        <button
          onClick={() => onViewApplicants(job.id)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors w-full sm:w-auto sm:ml-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver Aplicaciones
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function MyJobOffers() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "employer") {
      navigate("/unauthorized");
      return;
    }
    loadJobs();
  }, [user]);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    const { jobs: data, error } = await api.get("/api/jobs/mine", token);
    if (error) setError(error);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleEdit = (jobId) => navigate("/jobs/create?edit=" + jobId);

  const handleDelete = async (jobId, jobTitle) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar "' + jobTitle + '"?')) return;
    const { error } = await api.delete("/api/jobs/" + jobId, token);
    if (error) alert("Error al eliminar la oferta");
    else loadJobs();
  };

  const handleViewApplicants = (jobId) => navigate("/jobs/" + jobId + "/applicants");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            Mis Ofertas de Trabajo
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">
            Gestiona las ofertas de trabajo que has publicado
          </p>
        </div>
        <button
          onClick={() => navigate("/jobs/create")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: "#D06224", boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }}
        >
          <Plus className="w-4 h-4" />
          Crear Nueva Oferta
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ backgroundColor: "#D06224" }} />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">Cargando tus ofertas...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-red-300" />
          </div>
          <p className="text-sm text-red-500 text-center">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 bg-white rounded-2xl" style={{ boxShadow: "0 2px 16px rgba(44,26,14,0.06)" }}>
          <div className="w-20 h-20 rounded-2xl bg-[#FBF5E0] flex items-center justify-center">
            <Briefcase className="w-10 h-10" style={{ color: "#D06224" }} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-[#2C1A0E]">No has creado ninguna oferta todavía</p>
            <p className="text-sm text-[#5C3A1E]/50 mt-1">Crea tu primera oferta para comenzar a atraer candidatos</p>
          </div>
          <button
            onClick={() => navigate("/jobs/create")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: "#D06224" }}
          >
            <Plus className="w-4 h-4" />
            Crear Primera Oferta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <JobOfferCard key={job.id} job={job} onEdit={handleEdit} onDelete={handleDelete} onViewApplicants={handleViewApplicants} />
          ))}
        </div>
      )}
    </div>
  );
}
