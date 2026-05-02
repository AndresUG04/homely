import { createElement, useEffect, useMemo, useState } from "react";
import { Search, MapPin, Briefcase, RefreshCw, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";

const INPUT_BASE = {
  border: "2px solid #D0622220",
  backgroundColor: "#FBF5E0",
};

function textOrDash(value) {
  return value && String(value).trim() ? value : "-";
}

export default function SearchWorkers() {
  const { t } = useTranslation();
  const { profile, token } = useAuth();

  const [filters, setFilters] = useState({
    country: "",
    state: "",
    city: "",
    is_looking_for_job: "all",
  });
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.country.trim()) params.set("country", filters.country.trim());
    if (filters.state.trim()) params.set("state", filters.state.trim());
    if (filters.city.trim()) params.set("city", filters.city.trim());
    if (filters.is_looking_for_job !== "all") {
      params.set("is_looking_for_job", filters.is_looking_for_job);
    }
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      const endpoint = queryString ? `/api/users/workers?${queryString}` : "/api/users/workers";
      const data = await api.get(endpoint, token);

      if (data.error) {
        setError(data.error);
        setWorkers([]);
      } else {
        setWorkers(data.workers || []);
      }

      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [queryString, token]);

  if (profile?.role !== "employer") {
    return (
      <div
        className="bg-white rounded-2xl p-6"
        style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
      >
        <p className="text-sm text-[#5C3A1E]/70">{t("searchWorkers.employerOnly")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {t("searchWorkers.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {t("searchWorkers.subtitle")}
        </p>
      </div>

      <div
        className="bg-white rounded-2xl p-6"
        style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2
            className="text-base font-bold text-[#2C1A0E]"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("searchWorkers.filters")}
          </h2>
          <button
            type="button"
            onClick={() =>
              setFilters({ country: "", state: "", city: "", is_looking_for_job: "all" })
            }
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:bg-[#D06224]/10"
            style={{ color: "#D06224" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t("searchWorkers.clear")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <FilterInput
            icon={MapPin}
            label={t("searchWorkers.country")}
            value={filters.country}
            onChange={(value) => setFilters((prev) => ({ ...prev, country: value }))}
            placeholder={t("searchWorkers.countryPlaceholder")}
          />
          <FilterInput
            icon={MapPin}
            label={t("searchWorkers.state")}
            value={filters.state}
            onChange={(value) => setFilters((prev) => ({ ...prev, state: value }))}
            placeholder={t("searchWorkers.statePlaceholder")}
          />
          <FilterInput
            icon={MapPin}
            label={t("searchWorkers.city")}
            value={filters.city}
            onChange={(value) => setFilters((prev) => ({ ...prev, city: value }))}
            placeholder={t("searchWorkers.cityPlaceholder")}
          />

          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-[#2C1A0E]">
              <Briefcase className="w-3.5 h-3.5 text-[#D06224]" />
              {t("searchWorkers.availability")}
            </label>
            <select
              value={filters.is_looking_for_job}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, is_looking_for_job: e.target.value }))
              }
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
              style={INPUT_BASE}
              onFocus={(e) => (e.target.style.borderColor = "#D06224")}
              onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
            >
              <option value="all">{t("searchWorkers.all")}</option>
              <option value="true">{t("searchWorkers.available")}</option>
              <option value="false">{t("searchWorkers.notAvailable")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-4 border-[#D06224]/20 border-t-[#D06224] rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div
            className="bg-white rounded-2xl p-6 flex items-center gap-3"
            style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
          >
            <AlertCircle className="w-5 h-5 text-[#AE431E] flex-shrink-0" />
            <p className="text-sm text-[#AE431E]">{error}</p>
          </div>
        )}

        {!loading && !error && workers.length === 0 && (
          <div
            className="bg-white rounded-2xl p-8 text-center"
            style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-[#D06224]/50" />
            </div>
            <p className="text-sm text-[#5C3A1E]/60 mt-3">
              {t("searchWorkers.noResults")}
            </p>
          </div>
        )}

        {!loading && !error && workers.length > 0 && (
          <>
            <p className="text-sm text-[#5C3A1E]/70">
              {t("searchWorkers.results", { count: workers.length })}
            </p>
            <div className="grid grid-cols-1 gap-4">
              {workers.map((worker) => (
                <article
                  key={worker.id}
                  className="bg-white rounded-2xl p-5"
                  style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3
                        className="text-lg font-bold text-[#2C1A0E]"
                        style={{ fontFamily: "'Fraunces', serif" }}
                      >
                        {textOrDash(worker.full_name)}
                      </h3>
                      <p className="text-xs text-[#5C3A1E]/60 mt-1">{textOrDash(worker.email)}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: worker.is_looking_for_job ? "#8A863515" : "#AE431E15",
                        color: worker.is_looking_for_job ? "#8A8635" : "#AE431E",
                      }}
                    >
                      {worker.is_looking_for_job
                        ? t("searchWorkers.availableBadge")
                        : t("searchWorkers.notAvailableBadge")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoPill label={t("searchWorkers.countryPill")} value={worker.address?.country} />
                    <InfoPill label={t("searchWorkers.statePill")} value={worker.address?.state} />
                    <InfoPill label={t("searchWorkers.cityPill")} value={worker.address?.city} />
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#FBF5E0] border border-[#D0622215]">
                    <p className="text-xs text-[#5C3A1E]/60 mb-1">{t("searchWorkers.biography")}</p>
                    <p className="text-sm text-[#5C3A1E]">{textOrDash(worker.biography)}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FilterInput({ icon, label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-[#2C1A0E]">
        {createElement(icon, { className: "w-3.5 h-3.5 text-[#D06224]" })}
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
        style={INPUT_BASE}
        onFocus={(e) => (e.target.style.borderColor = "#D06224")}
        onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
      />
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: "#D062220D" }}>
      <p className="text-[11px] text-[#5C3A1E]/60">{label}</p>
      <p className="text-sm font-medium text-[#2C1A0E]">{textOrDash(value)}</p>
    </div>
  );
}