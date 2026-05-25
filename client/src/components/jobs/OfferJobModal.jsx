import { useEffect, useState } from "react";
import { X, Briefcase, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";

/**
 * Modal para que el empleador elija cuál de sus ofertas enviar a un trabajador.
 *
 * Props:
 *   workerId    {string}   — UUID del trabajador destinatario
 *   workerName  {string}   — Nombre del trabajador (para mostrar en el modal)
 *   isOpen      {boolean}  — Controla visibilidad
 *   onClose     {function} — Callback para cerrar el modal
 */
export default function OfferJobModal({ workerId, workerName, isOpen, onClose }) {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [offers, setOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Cargar las ofertas activas del empleador al abrir el modal
  useEffect(() => {
    if (!isOpen) return;
    setSelectedOfferId(null);
    setError(null);
    setSuccess(false);

    const fetchOffers = async () => {
      setLoading(true);
      const data = await api.get("/api/jobs/mine", token);
      if (data.error) {
        setError(data.error);
      } else {
        // Solo mostrar ofertas con status "open"
        const openOffers = (data.jobs || []).filter((j) => j.status === "open");
        setOffers(openOffers);
      }
      setLoading(false);
    };

    fetchOffers();
  }, [isOpen, token]);

  const handleSend = async () => {
    if (!selectedOfferId) return;
    setSending(true);
    setError(null);

    const result = await api.post(
      "/api/job-invitations",
      { job_offer_id: selectedOfferId, employee_user_id: workerId },
      token
    );

    setSending(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 24px 80px rgba(208,98,36,0.25)" }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2
                className="text-lg font-bold text-[#2C1A0E]"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {t("offerJobModal.title")}
              </h2>
              <p className="text-sm text-[#5C3A1E]/60 mt-0.5">
                {t("offerJobModal.subtitle", { name: workerName })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#5C3A1E]/40 hover:text-[#5C3A1E]/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Estado de éxito */}
          {success && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-[#2C1A0E]">{t("offerJobModal.successTitle")}</p>
              <p className="text-sm text-[#5C3A1E]/60">
                {t("offerJobModal.successBody", { name: workerName })}
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#D06224" }}
              >
                {t("offerJobModal.close")}
              </button>
            </div>
          )}

          {/* Cargando */}
          {!success && loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#D06224]/20 border-t-[#D06224] rounded-full animate-spin" />
            </div>
          )}

          {/* Sin ofertas abiertas */}
          {!success && !loading && offers.length === 0 && (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 mx-auto text-[#D06224]/30 mb-3" />
              <p className="text-sm text-[#5C3A1E]/60">{t("offerJobModal.noOffers")}</p>
            </div>
          )}

          {/* Lista de ofertas */}
          {!success && !loading && offers.length > 0 && (
            <>
              <p className="text-sm font-semibold text-[#2C1A0E] mb-3">
                {t("offerJobModal.selectLabel")}
              </p>
              <div className="space-y-2 mb-4">
                {offers.map((offer) => (
                  <button
                    key={offer.id}
                    type="button"
                    onClick={() => setSelectedOfferId(offer.id)}
                    className="w-full text-left rounded-xl p-3.5 border-2 transition-all duration-150"
                    style={{
                      borderColor: selectedOfferId === offer.id ? "#D06224" : "#D0622220",
                      backgroundColor: selectedOfferId === offer.id ? "#FBF5E0" : "white",
                    }}
                  >
                    <p className="font-semibold text-sm text-[#2C1A0E]">{offer.title}</p>
                    <p className="text-xs text-[#5C3A1E]/60 mt-0.5">
                      {offer.address?.city && `${offer.address.city} · `}
                      {offer.salary
                        ? `₡${Number(offer.salary).toLocaleString("es-CR")}/mes`
                        : t("offerJobModal.noSalary")}
                    </p>
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#5C3A1E]/70 border border-[#D0622230] hover:bg-[#FBF5E0] transition-colors"
                >
                  {t("offerJobModal.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!selectedOfferId || sending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                  style={{
                    backgroundColor: selectedOfferId && !sending ? "#D06224" : "#D0622260",
                    cursor: selectedOfferId && !sending ? "pointer" : "not-allowed",
                  }}
                >
                  {sending ? t("offerJobModal.sending") : t("offerJobModal.send")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
