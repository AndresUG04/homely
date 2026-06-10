import { useEffect, useState } from "react";
import { Mail, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { toast } from "sonner";

export default function MyInvitations() {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    const data = await api.get("/api/job-invitations/received", token);
    if (data.error) {
      setError(data.error);
    } else {
      setInvitations(data.invitations || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();
  }, [token]);

  const handleRespond = async (invitationId, status) => {
    setResponding(invitationId);
    const result = await api.put(`/api/job-invitations/${invitationId}`, { status }, token);
    setResponding(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        status === "accepted"
          ? t("myInvitations.acceptedToast")
          : t("myInvitations.rejectedToast")
      );
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status } : inv))
      );
    }
  };

  const pending = invitations.filter((i) => i.status === "pending");
  const history = invitations.filter((i) => i.status !== "pending");

  const formatSalary = (salary) =>
    salary ? `₡${Number(salary).toLocaleString("es-CR")}/mes` : t("myInvitations.noSalary");

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {t("myInvitations.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("myInvitations.subtitle")}</p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
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

      {!loading && !error && invitations.length === 0 && (
        <div
          className="bg-white rounded-2xl p-10 text-center"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <Mail className="w-10 h-10 mx-auto text-[#D06224]/30 mb-3" />
          <p className="text-sm text-[#5C3A1E]/60">{t("myInvitations.empty")}</p>
        </div>
      )}

      {!loading && !error && pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#5C3A1E]/60 uppercase tracking-wide">
            {t("myInvitations.pendingSection")} ({pending.length})
          </h2>
          {pending.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              onAccept={() => handleRespond(inv.id, "accepted")}
              onReject={() => handleRespond(inv.id, "rejected")}
              isResponding={responding === inv.id}
              formatSalary={formatSalary}
              t={t}
            />
          ))}
        </section>
      )}

      {!loading && !error && history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#5C3A1E]/60 uppercase tracking-wide">
            {t("myInvitations.historySection")}
          </h2>
          {history.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              formatSalary={formatSalary}
              t={t}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function InvitationCard({ invitation, onAccept, onReject, isResponding, formatSalary, t }) {
  const { job_offer: offer, status } = invitation;
  const isPending = status === "pending";
  const employerName = offer?.employer?.user?.full_name || "-";

  return (
    <article
      className="bg-white rounded-2xl p-5"
      style={{
        boxShadow: "0 2px 12px rgba(208,98,36,0.08)",
        borderLeft: isPending ? "4px solid #f39c12" : "4px solid transparent",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {isPending && (
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
              ✉ {t("myInvitations.pendingBadge")}
            </span>
          )}
          <h3
            className="text-base font-bold text-[#2C1A0E] mt-0.5"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {offer?.title || "-"}
          </h3>
          <p className="text-xs text-[#5C3A1E]/60">
            {t("myInvitations.employer")}: {employerName}
          </p>
          <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
            {offer?.address?.city && `${offer.address.city} · `}
            {formatSalary(offer?.salary)}
            {offer?.schedule?.schedule_type && ` · ${offer.schedule.schedule_type}`}
          </p>
        </div>

        {!isPending && (
          <StatusBadge status={status} t={t} />
        )}
      </div>

      {isPending && (
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onAccept}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ backgroundColor: isResponding ? "#22c55e80" : "#22c55e" }}
          >
            <CheckCircle className="w-4 h-4" />
            {isResponding ? t("myInvitations.processing") : t("myInvitations.accept")}
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isResponding}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ backgroundColor: isResponding ? "#ef444480" : "#ef4444" }}
          >
            <XCircle className="w-4 h-4" />
            {t("myInvitations.reject")}
          </button>
        </div>
      )}
    </article>
  );
}

function StatusBadge({ status, t }) {
  const config = {
    accepted: { color: "#22c55e", bg: "#22c55e15", label: "myInvitations.statusAccepted", icon: CheckCircle },
    rejected: { color: "#ef4444", bg: "#ef444415", label: "myInvitations.statusRejected", icon: XCircle },
    pending:  { color: "#f59e0b", bg: "#f59e0b15", label: "myInvitations.statusPending",  icon: Clock },
  };
  const { color, bg, label, icon: Icon } = config[status] || config.pending;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
      style={{ color, backgroundColor: bg }}
    >
      <Icon className="w-3.5 h-3.5" />
      {t(label)}
    </span>
  );
}
