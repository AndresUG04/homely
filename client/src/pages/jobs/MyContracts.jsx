import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import { useContractRealtime } from "../../hooks/useContractRealtime";
import {
  AlertCircle,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

function getStatusConfig(t) {
  return {
    pending_upload: {
      label: t("contracts.statusPendingUpload"),
      color: "#D06224",
      bgColor: "#D0622415",
      icon: Clock,
    },
    draft: {
      label: t("contracts.statusDraft"),
      color: "#5C3A1E",
      bgColor: "#5C3A1E15",
      icon: FileText,
    },
    sent: {
      label: t("contracts.statusPendingSign"),
      color: "#D06224",
      bgColor: "#D0622415",
      icon: Clock,
    },
    accepted: {
      label: t("contracts.active"),
      color: "#22c55e",
      bgColor: "#22c55e15",
      icon: CheckCircle,
    },
    worker_signed: {
      label: t("contracts.statusWorkerSigned"),
      color: "#22c55e",
      bgColor: "#22c55e15",
      icon: CheckCircle,
    },
    rejected: {
      label: t("contracts.statusRejected"),
      color: "#ef4444",
      bgColor: "#ef444415",
      icon: XCircle,
    },
    termination_pending: {
      label: t("contracts.statusTerminationPending"),
      color: "#92400E",
      bgColor: "#FEF3C7",
      icon: Clock,
    },
    finalized: {
      label: t("contracts.statusFinalized"),
      color: "#3b82f6",
      bgColor: "#3b82f615",
      icon: CheckCircle,
    },
  };
}

function formatDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return null;
  return `₡${Number(value).toLocaleString("es-CR")}`;
}

function ContractCard({ contract, onClick, isEmployer }) {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(t);
  const isPendingTermination = contract.has_pending_termination;
  const statusKey = contract.kind === "pending_upload" ? "pending_upload" : isPendingTermination ? "termination_pending" : contract.status;
  const config = statusConfig[statusKey] || statusConfig.draft;
  const StatusIcon = config.icon;

  const otherParty = isEmployer
    ? contract.employee?.user || {}
    : contract.employer?.user || {};

  const displayLabel = contract.kind === "pending_upload"
    ? t("contracts.contractPendingLabel")
    : t("contracts.contractLabel");

  return (
    <button
      onClick={() => onClick(contract)}
      className="w-full text-left bg-white rounded-2xl p-5 border border-[#E7D5B8] transition-all duration-200 hover:shadow-md active:scale-95"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-[#D06224] flex-shrink-0">
            {(otherParty.full_name || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#2C1A0E] truncate">
              {displayLabel} — {otherParty.full_name || "—"}
            </h3>
            <p className="text-sm text-[#5C3A1E]/70 truncate mt-1">
              {contract.title || t("contracts.contractWithoutTitle")}
            </p>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {config.label}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-[#5C3A1E]/60">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-[#D06224]" />
          {t("contracts.start")}: {formatDate(contract.start_date)}
        </div>
        {contract.salary && (
          <div className="flex items-center gap-1">
            <span>{formatCurrency(contract.salary)}</span>
          </div>
        )}
      </div>
    </button>
  );
}

export default function MyContracts() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const isEmployer = user?.role === "employer";

  const [contracts, setContracts] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");

    if (isEmployer) {
      const [{ contracts: contractData, error: contractsError }, { pendingApplications: pendingData, error: pendingError }] = await Promise.all([
        api.get("/api/contracts/my", token),
        api.get("/api/contracts/pending-upload", token),
      ]);

      if (contractsError || pendingError) {
        setError(contractsError || pendingError);
      } else {
        setContracts(contractData || []);
        setPendingItems(pendingData || []);
      }
    } else {
      const { contracts: contractData, error: contractsError } = await api.get("/api/contracts/my", token);

      if (contractsError) {
        setError(contractsError);
      } else {
        setContracts(contractData || []);
        setPendingItems([]);
      }
    }

    if (showLoading) setLoading(false);
  }, [token, isEmployer]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useContractRealtime(user?.id, {
    onUpdate: () => fetchData(false),
    onInsert: () => fetchData(false),
  });

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => fetchData(false), 5000);
    return () => clearInterval(interval);
  }, [user?.id, fetchData]);

  const tabs = isEmployer
    ? [
        { id: "all", label: t("contracts.all") },
        { id: "pending", label: t("contracts.pending") },
        { id: "accepted", label: t("contracts.active") },
        { id: "finalized", label: t("contracts.finalized") },
      ]
    : [
        { id: "all", label: t("contracts.all") },
        { id: "sent", label: t("contracts.pendingSign") },
        { id: "accepted", label: t("contracts.active") },
        { id: "finalized", label: t("contracts.finalized") },
      ];

  const pendingCards = pendingItems.map((item) => ({
    id: `pending-${item.id}`,
    kind: "pending_upload",
    application_id: item.id,
    job_offer_id: item.job_offer_id,
    title: item.job_offer?.title,
    salary: item.job_offer?.salary,
    start_date: item.created_at,
    status: "pending_upload",
    employee: item.employee,
    sourceApplication: item,
  }));

  const allItems = [...pendingCards, ...contracts];

  const filteredContracts = allItems.filter((item) => {
    if (filterTab === "all") return true;
    if (isEmployer) {
      if (filterTab === "pending") return item.kind === "pending_upload" || item.status === "sent" || item.status === "worker_signed" || item.has_pending_termination;
      return item.status === filterTab;
    } else {
      if (filterTab === "sent") return item.kind === "pending_sign" || item.status === "sent";
      return item.status === filterTab;
    }
  });

  const handleContractClick = (contract) => {
    if (isEmployer) {
      if (contract.kind === "pending_upload") {
        navigate(`/jobs/${contract.job_offer_id}/contracts/${contract.application_id}`, {
          state: { application: contract.sourceApplication, fromContracts: true },
        });
        return;
      }
      navigate(`/contracts/${contract.id}/review`, { state: { contract } });
    } else {
      navigate(`/contracts/${contract.id}/sign`, { state: { contract } });
    }
  };

  const currentTabLabel = tabs.find((tab) => tab.id === filterTab)?.label?.toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("contracts.myContracts")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {isEmployer ? t("contracts.contractsManagement") : t("contracts.yourContracts")}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterTab === tab.id
                ? "bg-[#D06224] text-white shadow-md"
                : "bg-white text-[#5C3A1E] border border-[#E7D5B8] hover:bg-[#FBF5E0]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">{t("contracts.loadingContracts")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">{error}</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#D06224]/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#D06224]/40" />
          </div>
          <p className="text-sm text-[#5C3A1E]/60 text-center">
            {filterTab === "all"
              ? t("contracts.noContractsYet")
              : t("contracts.noContractsForTab", { tab: currentTabLabel })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onClick={handleContractClick}
              isEmployer={isEmployer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
