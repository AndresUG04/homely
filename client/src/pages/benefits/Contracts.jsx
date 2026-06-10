import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { useTranslation } from "react-i18next";
import {
  Briefcase,
  User,
  ChevronRight,
  FileText,
} from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSalary(amount) {
  if (!amount && amount !== 0) return "—";
  return `₡${Number(amount).toLocaleString("es-CR")}`;
}

export default function Contracts({ onSelectContract }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  const estadoBadge = {
    accepted: { label: t("contractsAndBenefits.status.accepted"), cls: "bg-green-50 text-green-600" },
    expired:  { label: t("contractsAndBenefits.status.expired"),  cls: "bg-red-50 text-red-500"     },
    pending:  { label: t("contractsAndBenefits.status.pending"),  cls: "bg-amber-50 text-amber-600"  },
    rejected: { label: t("contractsAndBenefits.status.rejected"), cls: "bg-gray-100 text-gray-500"   },
  };

  useEffect(() => {
    const fetchContracts = async () => {
      const data = await api.get("/api/contracts", token);
      if (!data.error) setContracts(data);
      setLoading(false);
    };
    fetchContracts();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-8 h-8 border-4 border-[#D06224] border-t-transparent rounded-full animate-spin" />
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
          {t("contractsAndBenefits.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60">
          {t("contractsAndBenefits.subtitle")}
        </p>
      </div>

      <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
          {t("contractsAndBenefits.count", { count: contracts.length })}
        </p>

        <div className="mt-4 space-y-3">
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#D06224]" />
              </div>
              <p className="text-sm font-semibold text-[#2C1A0E]">
                {t("contractsAndBenefits.empty.title")}
              </p>
              <p className="text-xs text-[#5C3A1E]/60">
                {t("contractsAndBenefits.empty.description")}
              </p>
            </div>
          ) : (
            contracts.map((c) => {
              const badge = estadoBadge[c.status] ?? { label: c.status, cls: "bg-gray-100 text-gray-500" };
              const employerName = c.employer_user?.full_name ?? `Empleador #${c.employer_user_id?.slice(0, 8)}`;
              const jobTitle = c.job_offer?.title ?? "Contrato";
              const salary = formatSalary(c.salary ?? c.job_offer?.salary);

              return (
                <button
                  key={c.id}
                  onClick={() => onSelectContract(c)}
                  className="w-full flex items-center justify-between bg-[#FBF5E0] hover:bg-[#F5EAC8] active:bg-[#EDD99A] rounded-xl px-4 py-4 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#E7D5B8] flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-[#D06224]" />
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#2C1A0E]">{jobTitle}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-[#5C3A1E]/50" />
                        <p className="text-xs text-[#5C3A1E]/60">
                          {employerName} · {formatDate(c.start_date)} — {formatDate(c.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-[#2C1A0E]">{salary}</p>
                      <p className="text-xs text-[#5C3A1E]/60">{t("contractsAndBenefits.monthly")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#5C3A1E]/40 group-hover:text-[#D06224] transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}