import { FileText, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ContractList({ contracts, onSelect }) {
  const { t, i18n } = useTranslation();

  const locale = i18n.language === "fr" ? "fr-FR" : i18n.language === "en" ? "en-US" : "es-CR";

  if (contracts.length === 0) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
        <FileText className="w-8 h-8 text-[#D06224]" />
      </div>
      <h2 className="text-xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
        {t("contractList.no_contracts")}
      </h2>
      <p className="text-sm text-[#5C3A1E]/60">
        {t("contractList.no_contracts_subtitle")}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("contractList.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {t("contractList.subtitle")}
        </p>
      </div>

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <button
            key={contract.id}
            onClick={() => onSelect(contract)}
            className="bg-white rounded-2xl p-6 text-left transition-all hover:scale-[1.01]"
            style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)", border: "2px solid #FBF5E0" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#D06224]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {contract.title}
                  </h3>
                  <p className="text-sm text-[#5C3A1E]/70 mt-0.5">
                    {contract.employer_user?.full_name || `#${String(contract.employer_user_id || '').slice(0, 8)}`}
                  </p>
                  <p className="text-xs text-[#5C3A1E]/40 mt-0.5">
                    {t("contractList.since")} {new Date(contract.start_date).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/60">
                <Clock className="w-4 h-4" />
                <span>{contract.contract_schedule?.length || 0} {t("contractList.days_per_week")}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
