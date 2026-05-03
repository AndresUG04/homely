import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { Briefcase, MapPin, DollarSign, Clock } from "lucide-react";

function formatSchedule(schedule) {
  if (!schedule) return "—";
  if (!schedule.schedule_details?.length) return schedule.schedule_type || "—";
  return schedule.schedule_details
    .map(d => `${d.week_day}: ${d.start_time?.slice(0, 5)}-${d.end_time?.slice(0, 5)}`)
    .join(", ");
}

export default function MyJobOffers() {
  const { token, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile?.role === "employer") {
      loadJobs();
    }
  }, [profile]);

  const loadJobs = async () => {
    setLoading(true);
    const { jobs, error } = await api.get("/api/jobs/mine", token);
    if (error) setError(error);
    else setJobs(jobs || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-sm text-[#5C3A1E]/60">Cargando ofertas...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          Mis Ofertas de Trabajo
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          Gestiona las ofertas que has creado
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60">
            No tienes ofertas todavía
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map(job => {
            const location = job.address
              ? `${job.address.city || ""}, ${job.address.state || ""}`
              : "—";

            return (
              <div key={job.id}
                className="bg-white rounded-2xl p-5"
                style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
              >
                <h3 className="text-lg font-bold text-[#2C1A0E]">
                  {job.title}
                </h3>

                <p className="text-sm text-[#5C3A1E]/60 mt-1">
                  {job.description}
                </p>

                <div className="mt-4 space-y-2 text-sm text-[#5C3A1E]/60">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {location}
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatSchedule(job.schedule)}
                  </div>

                  <div className="flex items-center gap-2 text-[#D06224] font-semibold">
                    <DollarSign className="w-4 h-4" />
                    ₡{job.salary?.toLocaleString("es-CR")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}