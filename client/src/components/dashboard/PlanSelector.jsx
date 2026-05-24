import { useState, useEffect } from "react";
import { api } from "../../config/api";
import { X, CheckCircle, AlertCircle, Shield, Loader2 } from "lucide-react";

const PLAN_NAME_KEYS = {
  "Gratis": "plan_name_free",
  "Pro Empleador": "plan_name_pro_employer",
  "Business Empleador": "plan_name_business_employer",
  "Pro Trabajador": "plan_name_pro_worker",
};

const PLAN_DESC_KEYS = {
  "Perfil básico, 1 relación laboral activa, registro de asistencia y publicación de ofertas de trabajo.": "plan_desc_free_employer",
  "Incluye todo lo del plan gratuito, reportes PDF descargables, alertas de pagos y vencimientos, check de verificación y dashboard financiero.": "plan_desc_pro_employer",
  "Incluye todo lo del plan Pro, trabajadores ilimitados y panel multi-trabajador unificado.": "plan_desc_business_employer",
  "Perfil básico, historial laboral, gestión de contratos y asistencia, visibilidad estándar y referencias visibles.": "plan_desc_free_employee",
  "Incluye todo lo del plan gratuito, check de verificación, prioridad en búsquedas e historial verificado.": "plan_desc_pro_worker",
};

function translatePlanName(dbName, t) {
  const key = PLAN_NAME_KEYS[dbName];
  return key ? t(`editProfile.${key}`) : dbName;
}

function translatePlanDesc(dbDesc, t) {
  const key = PLAN_DESC_KEYS[dbDesc];
  return key ? t(`editProfile.${key}`) : dbDesc;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function PlanCard({ plan, selected, onSelect, t, isCurrent }) {
  const isFree = plan.price === 0;
  return (
    <button
      type="button"
      onClick={() => !isCurrent && onSelect(plan)}
      disabled={isCurrent}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        isCurrent
          ? "border-[#8A8635] bg-[#8A8635]/5 opacity-70 cursor-not-allowed"
          : selected
            ? "border-[#D06224] bg-[#D06224]/5"
            : "border-[#D0622220] bg-white hover:border-[#D06224]/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {translatePlanName(plan.name, t)}
          </p>
          <p className="text-xs text-[#5C3A1E]/60 mt-0.5 leading-relaxed">
            {translatePlanDesc(plan.description, t)}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-[#D06224]">
            ${plan.price}
          </p>
          <p className="text-[10px] text-[#5C3A1E]/50">{t("editProfile.plan_per_month")}</p>
        </div>
      </div>
      {isCurrent && (
        <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8A8635] text-white">
          {t("editProfile.plan_current")}
        </span>
      )}
      {isFree && !isCurrent && (
        <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8A863515] text-[#6B6828]">
          {t("editProfile.plan_free_tag")}
        </span>
      )}
    </button>
  );
}

export default function PlanSelector({ token, t, i18n, onClose, onSubscribed, currentSubscription }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentPlanId = currentSubscription?.plan?.id;

  useEffect(() => {
    const load = async () => {
      const data = await api.get("/api/users/plans", token);
      if (!data.error) {
        setPlans(data.plans);
        const firstNotCurrent = data.plans.find((p) => p.id !== currentPlanId);
        if (firstNotCurrent) setSelectedPlan(firstNotCurrent);
        else if (data.plans.length > 0) setSelectedPlan(data.plans[0]);
      }
      setLoading(false);
    };
    load();
  }, [token, currentPlanId]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (selectedPlan.id === currentPlanId) return;

    if (selectedPlan.price > 0) {
      if (cardNumber.replace(/\D/g, "").length < 13) {
        setFeedback({ type: "error", message: t("editProfile.plan_invalid_card") });
        return;
      }
      if (!cardName.trim()) {
        setFeedback({ type: "error", message: t("editProfile.plan_invalid_card_name") });
        return;
      }
      const expiryDigits = cardExpiry.replace(/\D/g, "");
      if (expiryDigits.length < 4) {
        setFeedback({ type: "error", message: t("editProfile.plan_invalid_expiry") });
        return;
      }
      if (cardCvv.replace(/\D/g, "").length < 3) {
        setFeedback({ type: "error", message: t("editProfile.plan_invalid_cvv") });
        return;
      }
    }

    setSubscribing(true);
    setFeedback(null);

    const body = {
      planId: selectedPlan.id,
      autoRenew,
      cardNumber: selectedPlan.price > 0 ? cardNumber.replace(/\D/g, "") : "4242424242424242",
      cardName: selectedPlan.price > 0 ? cardName.trim() : "",
      cardExpiry: selectedPlan.price > 0 ? cardExpiry.trim() : "",
      cardCvv: selectedPlan.price > 0 ? cardCvv.replace(/\D/g, "") : "",
    };

    const data = await api.post("/api/users/subscribe", body, token);

    if (data.error) {
      setFeedback({ type: "error", message: data.error });
    } else {
      setFeedback({ type: "success", message: t("editProfile.plan_subscribed") });
      setTimeout(() => {
        onSubscribed(data.subscription);
        onClose();
      }, 1200);
    }
    setSubscribing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b" style={{ borderColor: "#D0622210" }}>
          <h2 className="text-base font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("editProfile.plan_title")}
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5C3A1E]/40 hover:text-[#D06224] hover:bg-[#D06224]/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#D06224]" />
            </div>
          ) : (
            <>
              <p className="text-sm text-[#5C3A1E]/70">{t("editProfile.plan_select")}</p>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} selected={selectedPlan?.id === plan.id}
                    onSelect={setSelectedPlan} t={t} isCurrent={plan.id === currentPlanId} />
                ))}
              </div>

              {selectedPlan && selectedPlan.price > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-[#2C1A0E]">{t("editProfile.plan_payment")}</p>

                  <div className="rounded-xl p-4 space-y-3"
                    style={{ backgroundColor: "#FBF5E0", border: "2px solid #D0622220" }}>

                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C3A1E]/60 mb-1.5 block">
                        {t("editProfile.plan_card_number")}
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatCardNumber(cardNumber)}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                        placeholder={t("editProfile.placeholder_card_number")}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-[#2C1A0E] tracking-widest font-mono"
                        style={{ border: "2px solid #D0622220", backgroundColor: "#fff" }}
                        onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                        onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C3A1E]/60 mb-1.5 block">
                        {t("editProfile.plan_card_name")}
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder={t("editProfile.placeholder_card_name")}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-[#2C1A0E] font-mono"
                        style={{ border: "2px solid #D0622220", backgroundColor: "#fff" }}
                        onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                        onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C3A1E]/60 mb-1.5 block">
                          {t("editProfile.plan_card_expiry")}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardExpiry}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExpiry(formatExpiry(e.target.value));
                          }}
                          placeholder={t("editProfile.placeholder_card_expiry")}
                          maxLength={5}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-[#2C1A0E] font-mono"
                          style={{ border: "2px solid #D0622220", backgroundColor: "#fff" }}
                          onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                          onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#5C3A1E]/60 mb-1.5 block">
                          {t("editProfile.plan_card_cvv")}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                          placeholder={t("editProfile.placeholder_card_cvv")}
                          maxLength={3}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-[#2C1A0E] font-mono"
                          style={{ border: "2px solid #D0622220", backgroundColor: "#fff" }}
                          onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                          onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAutoRenew(!autoRenew)}
                  className="w-12 h-6 rounded-full transition-colors duration-200 flex items-center flex-shrink-0"
                  style={{ backgroundColor: autoRenew ? "#8A8635" : "#D0622220" }}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: autoRenew ? "translateX(26px)" : "translateX(2px)" }} />
                </button>
                <span className="text-sm text-[#5C3A1E]/70">{t("editProfile.plan_auto_renew")}</span>
              </div>

              {feedback && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    backgroundColor: feedback.type === "success" ? "#8A863515" : "#AE431E15",
                    color: feedback.type === "success" ? "#6B6828" : "#AE431E",
                    border: `1px solid ${feedback.type === "success" ? "#8A863530" : "#AE431E30"}`,
                  }}>
                  {feedback.type === "success"
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  }
                  {feedback.message}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing || !selectedPlan || selectedPlan.id === currentPlanId}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: "#D06224", boxShadow: "0 6px 20px rgba(208,98,36,0.30)" }}
              >
                {subscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {selectedPlan?.id === currentPlanId
                  ? t("editProfile.plan_current")
                  : subscribing
                    ? t("editProfile.plan_subscribing")
                    : t("editProfile.plan_subscribe")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { api } from "../../config/api";
import { X, CheckCircle, AlertCircle, Shield, Loader2 } from "lucide-react";

const PLAN_NAME_KEYS = {
  "Gratis": "plan_name_free",
  "Pro Empleador": "plan_name_pro_employer",
  "Business Empleador": "plan_name_business_employer",
  "Pro Trabajador": "plan_name_pro_worker",
};

const PLAN_DESC_KEYS = {
  "Perfil básico, 1 relación laboral activa, registro de asistencia y publicación de ofertas de trabajo.": "plan_desc_free_employer",
  "Incluye todo lo del plan gratuito, reportes PDF descargables, alertas de pagos y vencimientos, check de verificación y dashboard financiero.": "plan_desc_pro_employer",
  "Incluye todo lo del plan Pro, trabajadores ilimitados y panel multi-trabajador unificado.": "plan_desc_business_employer",
  "Perfil básico, historial laboral, gestión de contratos y asistencia, visibilidad estándar y referencias visibles.": "plan_desc_free_employee",
  "Incluye todo lo del plan gratuito, check de verificación, prioridad en búsquedas e historial verificado.": "plan_desc_pro_worker",
};

function translatePlanName(dbName, t) {
  const key = PLAN_NAME_KEYS[dbName];
  return key ? t(`editProfile.${key}`) : dbName;
}

function translatePlanDesc(dbDesc, t) {
  const key = PLAN_DESC_KEYS[dbDesc];
  return key ? t(`editProfile.${key}`) : dbDesc;
}

function PlanCard({ plan, selected, onSelect, t, isCurrent }) {
  const isFree = plan.price === 0;
  return (
    <button
      type="button"
      onClick={() => !isCurrent && onSelect(plan)}
      disabled={isCurrent}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        isCurrent
          ? "border-[#8A8635] bg-[#8A8635]/5 opacity-70 cursor-not-allowed"
          : selected
            ? "border-[#D06224] bg-[#D06224]/5"
            : "border-[#D0622220] bg-white hover:border-[#D06224]/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {translatePlanName(plan.name, t)}
          </p>
          <p className="text-xs text-[#5C3A1E]/60 mt-0.5 leading-relaxed">
            {translatePlanDesc(plan.description, t)}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-[#D06224]">
            ${plan.price}
          </p>
          <p className="text-[10px] text-[#5C3A1E]/50">{t("editProfile.plan_per_month")}</p>
        </div>
      </div>
      {isCurrent && (
        <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8A8635] text-white">
          {t("editProfile.plan_current")}
        </span>
      )}
      {isFree && !isCurrent && (
        <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#8A863515] text-[#6B6828]">
          {t("editProfile.plan_free_tag")}
        </span>
      )}
    </button>
  );
}

export default function PlanSelector({ token, t, i18n, onClose, onSubscribed, currentSubscription }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [autoRenew, setAutoRenew] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentPlanId = currentSubscription?.plan?.id;

  useEffect(() => {
    const load = async () => {
      const data = await api.get("/api/users/plans", token);
      if (!data.error) {
        setPlans(data.plans);
        const firstNotCurrent = data.plans.find((p) => p.id !== currentPlanId);
        if (firstNotCurrent) setSelectedPlan(firstNotCurrent);
        else if (data.plans.length > 0) setSelectedPlan(data.plans[0]);
      }
      setLoading(false);
    };
    load();
  }, [token, currentPlanId]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (selectedPlan.id === currentPlanId) return;
    if (selectedPlan.price > 0 && cardNumber.trim().length < 13) {
      setFeedback({ type: "error", message: t("editProfile.plan_invalid_card") });
      return;
    }

    setSubscribing(true);
    setFeedback(null);

    const body = {
      planId: selectedPlan.id,
      autoRenew,
      cardNumber: selectedPlan.price > 0 ? cardNumber.trim() : "4242424242424242",
    };

    const data = await api.post("/api/users/subscribe", body, token);

    if (data.error) {
      setFeedback({ type: "error", message: data.error });
    } else {
      setFeedback({ type: "success", message: t("editProfile.plan_subscribed") });
      setTimeout(() => {
        onSubscribed(data.subscription);
        onClose();
      }, 1200);
    }
    setSubscribing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b" style={{ borderColor: "#D0622210" }}>
          <h2 className="text-base font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {t("editProfile.plan_title")}
          </h2>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5C3A1E]/40 hover:text-[#D06224] hover:bg-[#D06224]/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#D06224]" />
            </div>
          ) : (
            <>
              <p className="text-sm text-[#5C3A1E]/70">{t("editProfile.plan_select")}</p>

              <div className="space-y-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} selected={selectedPlan?.id === plan.id}
                    onSelect={setSelectedPlan} t={t} isCurrent={plan.id === currentPlanId} />
                ))}
              </div>

              {selectedPlan && selectedPlan.price > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm font-semibold text-[#2C1A0E]">{t("editProfile.plan_payment")}</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all text-[#2C1A0E] tracking-widest font-mono"
                    style={{ border: "2px solid #D0622220", backgroundColor: "#FBF5E0" }}
                    onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                    onBlur={(e) => (e.target.style.borderColor = "#D0622220")}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAutoRenew(!autoRenew)}
                  className="w-12 h-6 rounded-full transition-colors duration-200 flex items-center flex-shrink-0"
                  style={{ backgroundColor: autoRenew ? "#8A8635" : "#D0622220" }}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: autoRenew ? "translateX(26px)" : "translateX(2px)" }} />
                </button>
                <span className="text-sm text-[#5C3A1E]/70">{t("editProfile.plan_auto_renew")}</span>
              </div>

              {feedback && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    backgroundColor: feedback.type === "success" ? "#8A863515" : "#AE431E15",
                    color: feedback.type === "success" ? "#6B6828" : "#AE431E",
                    border: `1px solid ${feedback.type === "success" ? "#8A863530" : "#AE431E30"}`,
                  }}>
                  {feedback.type === "success"
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  }
                  {feedback.message}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing || !selectedPlan || selectedPlan.id === currentPlanId}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: "#D06224", boxShadow: "0 6px 20px rgba(208,98,36,0.30)" }}
              >
                {subscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                {selectedPlan?.id === currentPlanId
                  ? t("editProfile.plan_current")
                  : subscribing
                    ? t("editProfile.plan_subscribing")
                    : t("editProfile.plan_subscribe")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
