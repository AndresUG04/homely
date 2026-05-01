import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { useTranslation } from "react-i18next";
import {
  Search, MapPin, Clock, DollarSign, Briefcase,
  AlertCircle, User, CheckSquare,
} from "lucide-react";

function formatSchedule(schedule, t) {
  if (!schedule) return "—";
  if (!schedule.schedule_details?.length) return schedule.schedule_type || "—";

  const details = schedule.schedule_details
    .map((d) => {
      const day = d.week_day;
      const start = d.start_time?.slice(0, 5) || "";
      const end = d.end_time?.slice(0, 5) || "";
      return `${day}: ${start}-${end}`;
    })
    .join(", ");

  return `${schedule.schedule_type || ""} (${details})`;
}

function JobCard({ job, onClick }) {
  const { t } = useTranslation();
  const address = job.address;
  const location = address
    ? `${address.city || ""}, ${address.state || ""}`.trim().replace(/^, |, $/g, "") || "—"
    : "—";

  const salary = job.salary ? `₡${job.salary.toLocaleString("es-CR")}` : "—";
  const employerName = job.employer?.user?.full_name || "—";

  return (
    <button
      onClick={() => onClick(job)}
      className="w-full text-left bg-white rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02] active:scale-95"
      style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-[#2C1A0E] truncate">{job.title}</h3>
          <p className="text-sm text-[#5C3A1E]/60 mt-1 line-clamp-2">{job.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/60">
          <User className="w-4 h-4" />
          <span className="text-xs truncate max-w-[120px]">{employerName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/60">
          <MapPin className="w-4 h-4" />
          <span className="text-xs truncate max-w-[120px]">{location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#5C3A1E]/60">
          <Clock className="w-4 h-4" />
          <span className="text-xs truncate max-w-[150px]">{formatSchedule(job.schedule, t)}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: "#D06224" }}>
          <DollarSign className="w-4 h-4" />
          <span className="text-sm font-semibold">{salary}</span>
        </div>
      </div>
    </button>
  );
}

function JobModal({ job, onClose }) {
  const { t } = useTranslation();
  const address = job.address;
  const location = address
    ? `${address.address_line_1 || ""}, ${address.city || ""}, ${address.state || ""}, ${address.country || ""}`.replace(/^, |, $/g, "")
    : "—";

  const salary = job.salary
    ? `₡${job.salary.toLocaleString("es-CR")}`
    : t("find_jobs.not_specified");

  const tasks = job.job_offer_tasks?.map((jot) => jot.task).filter(Boolean) || [];

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 24px 80px rgba(208,98,36,0.25)" }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-[#2C1A0E]">{job.title}</h2>
            <button onClick={onClose} className="text-[#5C3A1E]/40 hover:text-[#5C3A1E]/60 text-2xl leading-none">
              &times;
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs font-semibold text-[#D06224] uppercase tracking-wide">{t("find_jobs.schedule")}</p>
              <p className="text-base text-[#2C1A0E] mt-1">{formatSchedule(job.schedule, t)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#D06224] uppercase tracking-wide">{t("find_jobs.location")}</p>
              <div className="flex items-center gap-1.5 text-base text-[#2C1A0E] mt-1">
                <MapPin className="w-4 h-4" />
                {location}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#D06224] uppercase tracking-wide">{t("find_jobs.salary")}</p>
              <p className="text-lg font-bold text-[#D06224] mt-1">{salary}</p>
            </div>
            {job.employer?.user && (
              <div>
                <p className="text-xs font-semibold text-[#D06224] uppercase tracking-wide">{t("find_jobs.employer")}</p>
                <div className="flex items-center gap-1.5 text-base text-[#2C1A0E] mt-1">
                  <User className="w-4 h-4" />
                  {job.employer.user.full_name}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-[#D06224] uppercase tracking-wide">{t("find_jobs.description")}</p>
              <p className="text-sm text-[#2C1A0E] mt-1 whitespace-pre-wrap">{job.description || t("find_jobs.not_available")}</p>
            </div>
            {tasks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#D06224] uppercase tracking-wide">{t("find_jobs.tasks")}</p>
                <div className="mt-2 space-y-2">
                  {tasks.map((task, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "#FBF5E0" }}>
                      <CheckSquare className="w-4 h-4 mt-0.5 text-[#D06224] flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-[#2C1A0E]">{task.name}</p>
                        {task.description && (
                          <p className="text-xs text-[#5C3A1E]/60 mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={() => {}}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "#D06224", boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }}
            >
              {t("find_jobs.apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FindJobs() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scheduleType, setScheduleType] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);

  const scheduleTypes = [
    { value: "all",              label: t("find_jobs.schedule_all") },
    { value: "Tiempo completo",  label: t("find_jobs.schedule_full_time") },
    { value: "Medio tiempo",     label: t("find_jobs.schedule_part_time") },
    { value: "Fines de semana",  label: t("find_jobs.schedule_weekends") },
  ];

  useEffect(() => { loadJobs(); }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError("");
    let endpoint = "/api/jobs";

    if (search || scheduleType !== "all") {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (scheduleType !== "all") params.append("schedule_type", scheduleType);
      endpoint = `/api/jobs/search?${params.toString()}`;
    }

    const { jobs: data, error } = await api.get(endpoint, token);
    if (error) setError(error);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleFilterChange = (e) => {
    setScheduleType(e.target.value);
    loadJobs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("find_jobs.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("find_jobs.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C3A1E]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("find_jobs.search_placeholder")}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
            style={{ border: "2px solid #D0622220", backgroundColor: "#FBF5E0" }}
            onFocus={(e) => (e.target.style.borderColor = "#D06224")}
            onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
            onKeyDown={(e) => e.key === "Enter" && loadJobs()}
          />
        </div>

        <select
          value={scheduleType}
          onChange={handleFilterChange}
          className="px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ border: "2px solid #D0622220", backgroundColor: "#FBF5E0", color: "#2C1A0E" }}
          onFocus={(e) => (e.target.style.borderColor = "#D06224")}
          onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
        >
          {scheduleTypes.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={loadJobs}
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ backgroundColor: "#D06224", boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }}
        >
          {t("find_jobs.search_btn")}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("find_jobs.loading")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{t("find_jobs.no_results")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={setSelectedJob} />
          ))}
        </div>
      )}

      {selectedJob && <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}