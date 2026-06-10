import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { api } from "../../config/api";
import { X } from "lucide-react";

function formatDate(dateValue) {
  if (!dateValue) return "—";
  return new Date(dateValue).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitiatedByLabel(t, initiatedBy) {
  if (initiatedBy === "EMPLOYER") return t("contracts.initiatedByEmployer");
  if (initiatedBy === "EMPLOYEE") return t("contracts.initiatedByEmployee");
  if (initiatedBy === "SYSTEM") return t("contracts.initiatedBySystem");
  return initiatedBy || "—";
}

function getResponseLabel(t, response) {
  if (response === "ACCEPTED") return t("contracts.terminationResponseAccepted");
  if (response === "OBJECTED") return t("contracts.terminationResponseObjected");
  return response || "—";
}

export default function ContractTerminationPanel({
  contract,
  token,
  user,
  onContractUpdate,
}) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [terminationType, setTerminationType] = useState("");
  const [terminationReason, setTerminationReason] = useState("");
  const [submittingTermination, setSubmittingTermination] = useState(false);
  const [responseChoice, setResponseChoice] = useState("ACCEPTED");
  const [responseComment, setResponseComment] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  const termination = contract?.termination;
  const responses = contract?.terminationResponses || [];
  const isActive = contract?.status === "accepted";
  const isPendingFinalization = Boolean(termination && contract?.status !== "finalized");
  const userRole = user?.role === "employer" ? "EMPLOYER" : user?.role === "employee" ? "EMPLOYEE" : null;
  const existingResponse = responses.find((item) => item.user_id === user?.id);

  const canRespond = Boolean(
    termination &&
      userRole &&
      !existingResponse &&
      isPendingFinalization &&
      (termination.initiated_by === "SYSTEM" || termination.initiated_by !== userRole)
  );

  const typeOptions = useMemo(() => {
    if (userRole === "EMPLOYER") return ["DESPIDO"];
    if (userRole === "EMPLOYEE") return ["RENUNCIA"];
    return ["DESPIDO", "RENUNCIA", "VENCIMIENTO"];
  }, [userRole]);

  const handleTerminate = async () => {
    if (!terminationType) {
      toast.error(t("contracts.terminationTypeRequired"));
      return;
    }

    if (!terminationReason.trim()) {
      toast.error(t("contracts.terminationReasonRequired"));
      return;
    }

    setSubmittingTermination(true);
    const { contract: updatedContract, termination: createdTermination, terminationResponses, error } = await api.post(
      `/api/contracts/${contract.id}/terminate`,
      {
        type: terminationType,
        reason: terminationReason.trim(),
      },
      token
    );

    if (error) {
      setSubmittingTermination(false);
      toast.error(error);
      return;
    }

    const { contract: refreshedContract, termination: refreshedTermination, terminationResponses: refreshedResponses } = await api.get(
      `/api/contracts/${contract.id}`,
      token
    );

    setSubmittingTermination(false);

    if (refreshedContract) {
      onContractUpdate({
        ...refreshedContract,
        termination: refreshedTermination || createdTermination,
        terminationResponses: refreshedResponses || [],
      });
    } else {
      onContractUpdate({
        ...(updatedContract || contract),
        termination: createdTermination,
        terminationResponses: terminationResponses || [],
      });
    }

    setShowModal(false);
    setTerminationReason("");
    setTerminationType("");
    toast.success(t("contracts.terminationSuccess"));
  };

  const handleResponse = async () => {
    if (!termination?.id) return;

    if (responseChoice === "OBJECTED" && !responseComment.trim()) {
      toast.error(t("contracts.terminationCommentRequired"));
      return;
    }

    setSubmittingResponse(true);
    const { terminationResponses, error } = await api.post(
      `/api/terminations/${termination.id}/respond`,
      {
        response: responseChoice,
        comment: responseComment.trim(),
      },
      token
    );
    setSubmittingResponse(false);

    if (error) {
      toast.error(error);
      return;
    }

    const { contract: refreshedContract } = await api.get(`/api/contracts/${contract.id}`, token);

    if (refreshedContract) {
      onContractUpdate(refreshedContract);
    } else {
      onContractUpdate({
        ...contract,
        status: "finalized",
        terminationResponses: terminationResponses || contract.terminationResponses || [],
      });
    }

    setResponseComment("");
    setResponseChoice("ACCEPTED");
    toast.success(t("contracts.terminationResponseSaved"));
  };

  return (
    <section className="bg-white rounded-2xl p-5 border border-[#E7D5B8]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase">
          {t("contracts.terminationTitle")}
        </p>
        {contract?.status === "finalized" && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#334155]">
            {t("contracts.statusFinalized")}
          </span>
        )}
        {isPendingFinalization && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E]">
            {t("contracts.statusTerminationPending")}
          </span>
        )}
      </div>

      {!termination && isActive && (
        <div className="mt-4">
          <p className="text-sm text-[#5C3A1E]/70 mb-3">{t("contracts.terminationPrompt")}</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] text-white text-sm font-semibold hover:bg-[#B91C1C] transition-colors"
          >
            {t("contracts.terminationButton")}
          </button>
        </div>
      )}

      {!termination && !isActive && (
        <p className="mt-4 text-sm text-[#5C3A1E]/60">{t("contracts.terminationUnavailable")}</p>
      )}

      {termination && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-[#FEF6E0] border border-[#E7D5B8] px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[#5C3A1E]">
              <div>
                <p className="text-xs text-[#5C3A1E]/60">{t("contracts.terminationTypeLabel")}</p>
                <p className="font-semibold">{t(`contracts.terminationTypes.${termination.type}`)}</p>
              </div>
              <div>
                <p className="text-xs text-[#5C3A1E]/60">{t("contracts.terminationInitiatedBy")}</p>
                <p className="font-semibold">{getInitiatedByLabel(t, termination.initiated_by)}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-[#5C3A1E]/60">{t("contracts.terminationReasonLabel")}</p>
                <p className="font-semibold">{termination.reason}</p>
              </div>
              <div>
                <p className="text-xs text-[#5C3A1E]/60">{t("contracts.terminationDateLabel")}</p>
                <p className="font-semibold">{formatDate(termination.terminated_at)}</p>
              </div>
            </div>
          </div>

          {canRespond && (
            <div className="rounded-xl border border-[#CBD5F5] bg-[#EEF2FF] px-4 py-3 space-y-3">
              <p className="text-sm font-semibold text-[#1E3A8A]">{t("contracts.terminationRespondTitle")}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setResponseChoice("ACCEPTED")}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    responseChoice === "ACCEPTED"
                      ? "bg-[#2563EB] text-white"
                      : "bg-white text-[#1E3A8A] border border-[#CBD5F5]"
                  }`}
                >
                  {t("contracts.terminationResponseAccept")}
                </button>
                <button
                  type="button"
                  onClick={() => setResponseChoice("OBJECTED")}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    responseChoice === "OBJECTED"
                      ? "bg-[#DC2626] text-white"
                      : "bg-white text-[#991B1B] border border-[#FCA5A5]"
                  }`}
                >
                  {t("contracts.terminationResponseObject")}
                </button>
              </div>
              {responseChoice === "OBJECTED" && (
                <textarea
                  value={responseComment}
                  onChange={(event) => setResponseComment(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-[#FCA5A5] px-3 py-2 text-sm text-[#5C3A1E] focus:outline-none focus:ring-2 focus:ring-[#FCA5A5]/50"
                  placeholder={t("contracts.terminationCommentPlaceholder")}
                />
              )}
              <button
                type="button"
                onClick={handleResponse}
                disabled={submittingResponse}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submittingResponse ? t("contracts.sending") : t("contracts.terminationResponseSubmit")}
              </button>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#5C3A1E]/60 uppercase mb-2">
              {t("contracts.terminationResponsesTitle")}
            </p>
            {responses.length === 0 ? (
              <p className="text-sm text-[#5C3A1E]/60">{t("contracts.terminationResponsesEmpty")}</p>
            ) : (
              <div className="space-y-2">
                {responses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#5C3A1E]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#1E293B]">
                        {item.user?.full_name || t("contracts.terminationResponseUnknown")}
                      </p>
                      <span className="text-xs text-[#64748B]">{formatDate(item.responded_at)}</span>
                    </div>
                    <span
                      className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.response === "ACCEPTED"
                          ? "bg-[#DCFCE7] text-[#166534]"
                          : "bg-[#FEE2E2] text-[#991B1B]"
                      }`}
                    >
                      {getResponseLabel(t, item.response)}
                    </span>
                    {item.comment && (
                      <p className="text-sm text-[#5C3A1E] mt-2 border-t border-[#E7D5B8]/40 pt-2">
                        {item.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl z-10 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#D06224]/10">
              <h2 className="text-xl font-bold text-[#2C1A0E]">{t("contracts.terminationModalTitle")}</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#5C3A1E]/60 hover:text-[#5C3A1E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#2C1A0E]">
                  {t("contracts.terminationTypeLabel")}
                </label>
                <select
                  value={terminationType}
                  onChange={(event) => setTerminationType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#E7D5B8] px-3 py-2 text-sm text-[#5C3A1E] focus:outline-none focus:ring-2 focus:ring-[#D06224]/40"
                >
                  <option value="">{t("contracts.terminationTypePlaceholder")}</option>
                  {typeOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`contracts.terminationTypes.${option}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-[#2C1A0E]">
                  {t("contracts.terminationReasonLabel")}
                </label>
                <textarea
                  value={terminationReason}
                  onChange={(event) => setTerminationReason(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-[#E7D5B8] px-3 py-2 text-sm text-[#5C3A1E] focus:outline-none focus:ring-2 focus:ring-[#D06224]/40"
                  placeholder={t("contracts.terminationReasonPlaceholder")}
                />
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-[#5C3A1E] hover:bg-gray-200 transition-colors"
                >
                  {t("contracts.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleTerminate}
                  disabled={submittingTermination}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#DC2626] text-white hover:bg-[#B91C1C] transition-colors disabled:opacity-60"
                >
                  {submittingTermination ? t("contracts.sending") : t("contracts.terminationConfirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
