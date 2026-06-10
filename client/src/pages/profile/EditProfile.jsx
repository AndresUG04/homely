                                import { useState, useEffect } from "react";
  import { useAuth } from "../../context/AuthContext";
  import { useTranslation } from "react-i18next";
  import { WorkerAddWorkHistory } from "./WorkerAddWorkHistory";
  import PlanSelector from "../../components/dashboard/PlanSelector";
import FaceVerification from "../../components/FaceVerification";
  import { api } from "../../config/api";
  import {
    User, Mail, Shield, Lock, CheckCircle, AlertCircle, Save,
    Eye, EyeOff, Phone, Hash, Globe, MapPin, AlignLeft, Briefcase, FolderOpen, Star, Camera, Check
  } from "lucide-react";

const ROLE_COLORS = {
  employer: { bg: "#D0622215", text: "#D06224" },
  employee: { bg: "#8A863515", text: "#8A8635" },
};
const LANGUAGES = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

// Opciones de chips para reseñas de empleador sobre trabajadora
const TREATMENT_OPTIONS = [
  { label: "Muy amable",           positive: true  },
  { label: "Respetuosa",           positive: true  },
  { label: "Discreta",             positive: true  },
  { label: "Comunicativa",         positive: true  },
  { label: "Puntual",              positive: true  },
  { label: "Con actitud difícil",  positive: false },
  { label: "Poco comunicativa",    positive: false },
  { label: "Irrespetuosa",         positive: false },
];
const RESPONSIBILITY_OPTIONS = [
  { label: "Muy responsable",             positive: true  },
  { label: "Cumple horarios",             positive: true  },
  { label: "Proactiva",                   positive: true  },
  { label: "Ordenada",                    positive: true  },
  { label: "Requiere supervisión constante", positive: false },
  { label: "Incumple horarios",           positive: false },
  { label: "Descuidada",                  positive: false },
];

function normalizeChipLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Palabras clave positivas para colorear chips en la vista de referencias
const POSITIVE_KEYWORDS = new Set([
  "muy amable",
  "respetuosa",
  "respetuoso",
  "respetuoso/a",
  "discreta",
  "discreto",
  "discreto/a",
  "comunicativa",
  "comunicativo",
  "comunicativo/a",
  "puntual",
  "muy responsable",
  "cumple horarios",
  "proactiva",
  "proactivo",
  "proactivo/a",
  "ordenada",
  "ordenado",
  "ordenado/a",
]);

function Toast({ type, message }) {
  const isSuccess = type === "success";
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
      style={{
        backgroundColor: isSuccess ? "#8A863515" : "#AE431E15",
        color: isSuccess ? "#6B6828" : "#AE431E",
        border: `1px solid ${isSuccess ? "#8A863530" : "#AE431E30"}`,
      }}>
      {isSuccess ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
      <div className="mb-4 sm:mb-5 pb-3 sm:pb-4 border-b" style={{ borderColor: "#D0622210" }}>
        <h2 className="text-sm sm:text-base font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>{title}</h2>
        {description && <p className="text-xs text-[#5C3A1E]/50 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  const IconComponent = Icon;
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-[#2C1A0E]">
        <IconComponent className="w-3.5 h-3.5 text-[#D06224]" />{label}
      </label>
      {children}
    </div>
  );
}

const inputBase = { border: "2px solid #D0622220", backgroundColor: "#FBF5E0" };
const inputDisabled = { border: "2px solid #D0622210", backgroundColor: "#F5EDD6", color: "#5C3A1E80", cursor: "not-allowed" };

function TextInput({ value, onChange, placeholder, type = "text" }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
      style={inputBase}
      onFocus={(e) => (e.target.style.borderColor = "#D06224")}
      onBlur={(e) => (e.target.style.borderColor = "#D0622220")} />
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!value)}
        className="w-12 h-6 rounded-full transition-colors duration-200 flex items-center flex-shrink-0"
        style={{ backgroundColor: value ? "#8A8635" : "#D0622220" }}>
        <div className="w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: value ? "translateX(26px)" : "translateX(2px)" }} />
      </button>
      {label && <span className="text-sm text-[#5C3A1E]/70">{label}</span>}
    </div>
  );
}

function SaveButton({ saving, label, savingLabel }) {
  return (
    <div className="flex justify-end pt-1">
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
        style={{
          backgroundColor: saving ? "#D0622470" : "#D06224",
          boxShadow: saving ? "none" : "0 6px 20px rgba(208,98,36,0.30)",
        }}
      >
        <Save className="w-4 h-4" />
        {saving ? savingLabel : label}
      </button>
    </div>
  );
}

const AVATAR_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars`
  : "";

const PLAN_NAME_KEYS = {
  "Gratis": "plan_name_free",
  "Pro Empleador": "plan_name_pro_employer",
  "Business Empleador": "plan_name_business_employer",
  "Pro Trabajador": "plan_name_pro_worker",
};

function translatePlanName(dbName, t) {
  const key = PLAN_NAME_KEYS[dbName];
  return key ? t(`editProfile.${key}`) : dbName;
}

// Renderiza chips de una referencia con colores según positivo/negativo
function ReferenceChips({ treatment, responsibility }) {
  const treatmentChips = treatment
    ? treatment.split(",").map(v => v.trim()).filter(Boolean)
    : [];
  const responsibilityChips = responsibility
    ? responsibility.split(",").map(v => v.trim()).filter(Boolean)
    : [];
  const allChips = [...treatmentChips, ...responsibilityChips];
  if (!allChips.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {allChips.map((chip, j) => {
        const isPositive = POSITIVE_KEYWORDS.has(normalizeChipLabel(chip));
        return (
          <span
            key={j}
            className="px-2.5 py-1 rounded-full text-xs font-medium"
            style={
              isPositive
                ? { background: "#E8F5EE", color: "#2F855A" }
                : { background: "#FEE2E2", color: "#DC2626" }
            }
          >
            {chip}
          </span>
        );
      })}
    </div>
  );
}

export default function EditProfile() {
  const { profile, token, setProfile } = useAuth();
  const { t, i18n } = useTranslation();

  const ROLE_LABELS = {
    employer: t("editProfile.role_employer"),
    employee: t("editProfile.role_worker"),
  };

    const [formData, setFormData] = useState({
      full_name: "", phone: "", age: "", language: "es",
      country: "", state: "", city: "", postal_code: "",
      address_line_1: "", address_line_2: "", biography: "",
      is_looking_for_job: true, description: "",
    });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [profileFeedback, setProfileFeedback] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState(null);
    const [workHistory, setWorkHistory] = useState([]);
    const [references, setReferences] = useState([]);
    const [openAddWorkHistory, setOpenAddWorkHistory] = useState(false);
    const [privacy, setPrivacy] = useState({
      email: true, phone: true, age: true,
      address: true, biography: true, work_history: true,
    });
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarError, setAvatarError] = useState(false);
    const [avatarCacheKey, setAvatarCacheKey] = useState(Date.now());
    const [subscription, setSubscription] = useState(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true);
    const [showPlans, setShowPlans] = useState(false);
    const [privacyFeedback, setPrivacyFeedback] = useState(null);
    const [referencesFeedback, setReferencesFeedback] = useState(null);
    const [savingPrivacy, setSavingPrivacy] = useState(false);
    const [savingReferences, setSavingReferences] = useState(false);
    const [faceVerified, setFaceVerified] = useState(false);
    const [showFaceVerification, setShowFaceVerification] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await api.get("/api/users/profile", token);
      if (!data.error) {
        const u = data.user;
        setWorkHistory(u.work_history || []);
        setFormData({
          full_name: u.full_name || "", phone: u.phone || "", age: u.age || "",
          language: u.language || "es", country: u.address?.country || "",
          state: u.address?.state || "", city: u.address?.city || "",
          postal_code: u.address?.postal_code || "",
          address_line_1: u.address?.address_line_1 || "",
          address_line_2: u.address?.address_line_2 || "",
          biography: u.biography || "", is_looking_for_job: u.is_looking_for_job ?? true,
          description: u.description || "",
        });
        setPrivacy(u.privacy_settings || {
          email: true, phone: true, age: true,
          address: true, biography: true, work_history: true,
        });
        setAvatarUrl(u.avatar_url || null);
        setReferences(u.references || []);
        setFaceVerified(u.face_verified || false);
        }
        setLoadingProfile(false);
      };
      load();
    }, [token]);

  useEffect(() => {
    const load = async () => {
      const data = await api.get("/api/users/subscription", token);
      if (!data.error && data.subscription) {
        setSubscription(data.subscription);
      }
      setLoadingSubscription(false);
    };
    load();
  }, [token]);

  const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const initials = formData.full_name
    ? formData.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : (profile?.email?.[0] || "?").toUpperCase();

  const roleColors = ROLE_COLORS[profile?.role] || ROLE_COLORS.employee;
  const isWorker = profile?.role === "employee";
  const isEmployer = profile?.role === "employer";
  const isVerified = subscription?.status === "Activa" && (subscription.plan?.price || 0) > 0;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;
    setSavingProfile(true);
    setProfileFeedback(null);
    const data = await api.put("/api/users/profile", {
      full_name: formData.full_name, phone: formData.phone, age: formData.age,
      language: formData.language,
      address: { country: formData.country, state: formData.state, city: formData.city,
        postal_code: formData.postal_code, address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2 },
      biography: formData.biography, is_looking_for_job: formData.is_looking_for_job,
      description: formData.description,
    }, token);
    if (data.error) {
      setProfileFeedback({ type: "error", message: data.error });
    } else {
      setProfileFeedback({ type: "success", message: t("editProfile.success_profile") });
      setProfile(data.user);
    }
    setSavingProfile(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordFeedback(null);
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", message: t("editProfile.error_passwords") });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", message: t("editProfile.error_length") });
      return;
    }
    setSavingPassword(true);
    const data = await api.put("/api/users/password", { current_password: currentPassword, new_password: newPassword }, token);
    if (data.error) {
      setPasswordFeedback({ type: "error", message: data.error });
    } else {
      setPasswordFeedback({ type: "success", message: t("editProfile.save_password") });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const refreshWorkHistory = async () => {
    const data = await api.get("/api/users/profile", token);
    if (!data.error) setWorkHistory(data.user.work_history || []);
  };

  const handleAddWorkHistory = async (jobData) => {
    try {
      const data = await api.post("/api/users/work-history", {
        title: jobData.title, description: jobData.description,
        startDate: jobData.startDate, endDate: jobData.endDate,
        status: "declared", tasks: jobData.tasks
      }, token);
      if (data.error) { console.error(data.error); return; }
      await refreshWorkHistory();
    } catch (err) { console.error(err); }
  };

  const handleDeleteWorkHistory = async (id) => {
    try {
      const res = await api.delete(`/api/users/work-history/${id}`, token);
      if (res.error) { console.error(res.error); return; }
      setWorkHistory((prev) => prev.filter((j) => j.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSavePrivacy = async (e) => {
    e.preventDefault();
    setSavingPrivacy(true);
    setPrivacyFeedback(null);
    const data = await api.put("/api/users/privacy", { privacy_settings: privacy }, token);
    if (data.error) {
      setPrivacyFeedback({ type: "error", message: data.error });
    } else {
      setPrivacyFeedback({ type: "success", message: t("editProfile.success_privacy") });
    }
    setSavingPrivacy(false);
    setTimeout(() => setPrivacyFeedback(null), 2000);
  };

  const handleSaveReferences = async (e) => {
    e.preventDefault();
    setSavingReferences(true);
    await Promise.all(
      references.map((ref) =>
        api.put(
          `/api/users/${ref.author_app_user_id}/visibility`,
          { visible: ref.visible !== false },
          token
        )
      )
    );
    setSavingReferences(false);
    setReferencesFeedback({ type: "success", message: t("editProfile.success_references") });
    setTimeout(() => setReferencesFeedback(null), 2000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setProfileFeedback({ type: "error", message: "Solo se permiten imágenes (JPEG, PNG, WebP, GIF)" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileFeedback({ type: "error", message: "La imagen no puede superar los 5 MB" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setAvatarPreview(ev.target.result);
      setUploadingAvatar(true);
      setProfileFeedback(null);

      const data = await api.post("/api/users/avatar", {
        fileBase64: base64,
        fileType: file.type,
      }, token);

      if (data.error) {
        setProfileFeedback({ type: "error", message: data.error });
        setAvatarPreview(null);
      } else {
        setAvatarUrl(data.avatar_url);
        setAvatarError(false);
        setAvatarCacheKey(Date.now());
        setFaceVerified(false);
        setProfileFeedback({ type: "success", message: t("editProfile.success_avatar") });
        setProfile((prev) => ({ ...prev, avatar_url: data.avatar_url }));
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, avatar_url: data.avatar_url }));
      }
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#D06224]/20 border-t-[#D06224] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("editProfile.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("editProfile.subtitle")}</p>
      </div>

        <div className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
          style={{
            background: isWorker ? "linear-gradient(135deg, #8A8635 0%, #6B6828 100%)" : "linear-gradient(135deg, #D06224 0%, #AE431E 100%)",
            boxShadow: isWorker ? "0 8px 24px rgba(138,134,53,0.25)" : "0 8px 24px rgba(208,98,36,0.25)",
          }}>
          <div className="relative group flex-shrink-0">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden ${
              faceVerified ? "ring-2 ring-[#22C55E]" : ""
            }`}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : avatarUrl && !avatarError ? (
                <img
                  src={`${AVATAR_BASE_URL}/${avatarUrl}?t=${avatarCacheKey}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : null}
              {(!avatarUrl && !avatarPreview) || avatarError ? (
                <span className="text-xl sm:text-2xl font-bold text-[#FBF5E0]" style={{ fontFamily: "'Fraunces', serif" }}>{initials}</span>
              ) : null}
            </div>
            {faceVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#22C55E] flex items-center justify-center ring-2 ring-white">
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" strokeWidth={3} />
              </div>
            )}
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center cursor-pointer transition-all duration-200"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-0.5">
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white drop-shadow" />
                    <span className="text-[10px] text-white font-semibold drop-shadow leading-none">{t("editProfile.avatar_change")}</span>
                  </>
                )}
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-[#FBF5E0]" style={{ fontFamily: "'Fraunces', serif" }}>
              {formData.full_name || "—"}
              {isVerified && <Shield className="w-4 h-4 inline ml-1.5 -mt-0.5" style={{ color: "#2563EB" }} />}
            </p>
            <p className="text-[#FBF5E0]/70 text-xs sm:text-sm break-all">{profile?.email}</p>
            <span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(251,245,224,0.2)", color: "#FBF5E0" }}>
              {ROLE_LABELS[profile?.role] || profile?.role}
            </span>
          </div>
        </div>

        <SectionCard title={t("editProfile.section_subscription")} description={t("editProfile.section_subscription_desc")}>
          {loadingSubscription ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-3 border-[#D06224]/20 border-t-[#D06224] rounded-full animate-spin" />
            </div>
          ) : subscription ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {translatePlanName(subscription.plan?.name, t)}
                  </p>
                  <p className="text-xs text-[#5C3A1E]/60">
                    ${subscription.plan?.price} USD / {t("editProfile.subscription_month")}
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: subscription.status === "Activa" ? "#8A863515" : "#AE431E15",
                    color: subscription.status === "Activa" ? "#6B6828" : "#AE431E",
                  }}>
                  {subscription.status === "Activa"
                    ? t("editProfile.subscription_active")
                    : subscription.status === "Expirada"
                      ? t("editProfile.subscription_expired")
                      : t("editProfile.subscription_cancelled")}
                </span>
              </div>
              {subscription.expiration_date && (
                <div className="flex items-center gap-2 text-sm text-[#5C3A1E]/70">
                  <span>{t("editProfile.subscription_expires")}:</span>
                  <span className="font-semibold text-[#2C1A0E]">
                    {new Date(subscription.expiration_date).toLocaleDateString(
                      i18n.language, { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </span>
                </div>
              )}
              <button type="button" onClick={() => setShowPlans(true)}
                className="self-start mt-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#D06224", color: "white", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
                {t("editProfile.plan_change")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#2C1A0E]">{t("editProfile.subscription_no_plan")}</p>
                  <p className="text-xs text-[#5C3A1E]/60 mt-0.5">{t("editProfile.subscription_no_plan_desc")}</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "#D0622215", color: "#D06224" }}>
                  {t("editProfile.subscription_none")}
                </span>
              </div>
              <button type="button" onClick={() => setShowPlans(true)}
                className="self-start text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#D06224", color: "white", boxShadow: "0 4px 12px rgba(208,98,36,0.25)" }}>
                {t("editProfile.plan_view")}
              </button>
            </div>
          )}
        </SectionCard>

        {avatarUrl && (
          <SectionCard title={t("editProfile.face_verify_title")} description={t("editProfile.face_verify_desc")}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${faceVerified ? "bg-[#22C55E]" : "bg-[#D0622215]"}`}>
                  {faceVerified ? (
                    <Check className="w-5 h-5 text-white" strokeWidth={3} />
                  ) : (
                    <Camera className="w-4 h-4" style={{ color: "#D06224" }} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C1A0E]">
                    {faceVerified ? t("editProfile.face_verify_verified") : t("editProfile.face_verify_pending")}
                  </p>
                  <p className="text-xs text-[#5C3A1E]/60">
                    {faceVerified
                      ? t("editProfile.face_verify_verified_desc")
                      : t("editProfile.face_verify_pending_desc")}
                  </p>
                </div>
              </div>
              {!faceVerified && (
                <button
                  type="button"
                  onClick={() => setShowFaceVerification(true)}
                  className="self-start mt-1 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: "#22C55E", color: "white", boxShadow: "0 4px 12px rgba(34,197,94,0.25)" }}
                >
                  {t("editProfile.face_verify_button")}
                </button>
              )}
            </div>
          </SectionCard>
        )}

      {/* DATOS PERSONALES */}
      <SectionCard title={t("editProfile.section_personal")} description={t("editProfile.section_personal_desc")}>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("editProfile.field_name")} icon={User}>
              <TextInput value={formData.full_name} onChange={set("full_name")} placeholder={t("editProfile.placeholder_name")} />
            </Field>
            <Field label={t("editProfile.field_phone")} icon={Phone}>
              <TextInput value={formData.phone} onChange={set("phone")} placeholder={t("editProfile.placeholder_phone")} type="tel" />
            </Field>
            <Field label={t("editProfile.field_age")} icon={Hash}>
              <TextInput value={formData.age} onChange={set("age")} placeholder={t("editProfile.placeholder_age")} type="number" />
            </Field>
            <Field label={t("editProfile.field_language")} icon={Globe}>
              <select value={formData.language} onChange={set("language")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                onBlur={(e) => (e.target.style.borderColor = "#D0622220")}>
                {LANGUAGES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>
          <Field label={t("editProfile.field_email")} icon={Mail}>
            <input type="email" value={profile?.email || ""} disabled className="w-full px-4 py-3 rounded-xl text-sm" style={inputDisabled} />
          </Field>
          <Field label={t("editProfile.field_role")} icon={Shield}>
            <div className="w-full px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={inputDisabled}>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: roleColors.bg, color: roleColors.text }}>
                {ROLE_LABELS[profile?.role] || profile?.role}
              </span>
            </div>
          </Field>
          {profileFeedback && <Toast type={profileFeedback.type} message={profileFeedback.message} />}
          <SaveButton saving={savingProfile} label={t("editProfile.save_changes")} savingLabel={t("editProfile.saving")} />
        </form>
      </SectionCard>

      {/* DIRECCIÓN */}
      <SectionCard title={t("editProfile.section_address")} description={t("editProfile.section_address_desc")}>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("editProfile.field_country")} icon={MapPin}>
              <TextInput value={formData.country} onChange={set("country")} placeholder={t("editProfile.placeholder_country")} />
            </Field>
            <Field label={t("editProfile.field_state")} icon={MapPin}>
              <TextInput value={formData.state} onChange={set("state")} placeholder={t("editProfile.placeholder_state")} />
            </Field>
            <Field label={t("editProfile.field_city")} icon={MapPin}>
              <TextInput value={formData.city} onChange={set("city")} placeholder={t("editProfile.placeholder_city")} />
            </Field>
            <Field label={t("editProfile.field_postal")} icon={MapPin}>
              <TextInput value={formData.postal_code} onChange={set("postal_code")} placeholder={t("editProfile.placeholder_postal")} />
            </Field>
          </div>
          <Field label={t("editProfile.field_address1")} icon={MapPin}>
            <TextInput value={formData.address_line_1} onChange={set("address_line_1")} placeholder={t("editProfile.placeholder_address1")} />
          </Field>
          <Field label={t("editProfile.field_address2")} icon={MapPin}>
            <TextInput value={formData.address_line_2} onChange={set("address_line_2")} placeholder={t("editProfile.placeholder_address2")} />
          </Field>
          <SaveButton saving={savingProfile} label={t("editProfile.save_address")} savingLabel={t("editProfile.saving")} />
        </form>
      </SectionCard>

      {/* PERFIL PORTÁTIL — solo trabajadoras */}
      {isWorker && (
        <SectionCard title={t("editProfile.section_portable")} description={t("editProfile.section_portable_desc")}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Field label={t("editProfile.field_biography")} icon={AlignLeft}>
              <textarea value={formData.biography} onChange={set("biography")}
                placeholder={t("editProfile.placeholder_biography")} rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E] resize-none"
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                onBlur={(e) => (e.target.style.borderColor = "#D0622220")} />
            </Field>
            <Field label={t("editProfile.field_availability")} icon={Briefcase}>
              <Toggle
                value={formData.is_looking_for_job}
                onChange={(val) => setFormData((prev) => ({ ...prev, is_looking_for_job: val }))}
                label={formData.is_looking_for_job ? t("editProfile.available") : t("editProfile.not_available")}
              />
            </Field>
            <Field label={t("editProfile.field_work_history")} icon={FolderOpen} />
            <div className="flex justify-start">
              <button type="button" onClick={() => setOpenAddWorkHistory(true)}
                className="px-2 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#8A8635" }}>
                {t("editProfile.add_work_history")}
              </button>
            </div>
            {workHistory.length > 0 && (
              <div className="space-y-3 mt-4">
                {workHistory.map((job) => (
                  <div key={job.id} className="p-4 rounded-xl border relative pt-10 sm:pt-4"
                    style={{ borderColor: "#D0622215", backgroundColor: "#FBF5E0" }}>
                    <button type="button" onClick={() => handleDeleteWorkHistory(job.id)}
                      className="absolute top-3 right-3 text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: "#AE431E15", color: "#AE431E" }}>
                      {t("editProfile.delete")}
                    </button>
                    <p className="font-semibold text-[#2C1A0E]">{job.title}</p>
                    <p className="text-xs text-[#5C3A1E]/70">{job.start_date} — {job.end_date || t("editProfile.current_date")}</p>
                    {job.description && <p className="text-sm mt-1 text-[#5C3A1E]">{job.description}</p>}
                    <div className="flex flex-col gap-2 mt-2">
                      {job.work_history_task.map((wht, i) => (
                        <div key={i} className="flex flex-col gap-0.5 px-3 py-2 rounded-lg text-xs"
                          style={{ backgroundColor: "#8A863515", color: "#8A8635" }}>
                          <span className="font-medium leading-snug">{wht.task?.name}</span>
                          {wht.task?.description && (
                            <span className="leading-snug" style={{ color: "#8A8635", opacity: 0.65 }}>
                              {wht.task?.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <SaveButton saving={savingProfile} label={t("editProfile.save_portable")} savingLabel={t("editProfile.saving")} />
          </form>
        </SectionCard>
      )}

      {/* DESCRIPCIÓN — solo empleadores */}
      {isEmployer && (
        <SectionCard title={t("editProfile.section_about")} description={t("editProfile.section_about_desc")}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Field label={t("editProfile.field_description")} icon={AlignLeft}>
              <textarea value={formData.description} onChange={set("description")}
                placeholder={t("editProfile.placeholder_description")} rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E] resize-none"
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                onBlur={(e) => (e.target.style.borderColor = "#D0622220")} />
            </Field>
            <SaveButton saving={savingProfile} label={t("editProfile.save_description")} savingLabel={t("editProfile.saving")} />
          </form>
        </SectionCard>
      )}

      {/* PRIVACIDAD */}
      <SectionCard title={t("editProfile.section_privacy")} description={t("editProfile.section_privacy_desc")}>
        <form onSubmit={handleSavePrivacy} className="space-y-4">
          {[
            { key: "email",   label: t("editProfile.field_email"),   icon: Mail   },
            { key: "phone",   label: t("editProfile.field_phone"),   icon: Phone  },
            { key: "age",     label: t("editProfile.field_age"),     icon: Hash   },
            { key: "address", label: t("editProfile.section_address"), icon: MapPin },
          ].map(({ key, label, icon }) => (
            <Field key={key} label={label} icon={icon}>
              <Toggle
                value={privacy[key] !== false}
                onChange={(val) => setPrivacy((prev) => ({ ...prev, [key]: val }))}
                label={privacy[key] !== false
                  ? t("editProfile.field_privacy_visible")
                  : t("editProfile.field_privacy_hidden")}
              />
            </Field>
          ))}
          {privacyFeedback && <Toast type={privacyFeedback.type} message={privacyFeedback.message} />}
          <SaveButton saving={savingPrivacy} label={t("editProfile.save_privacy")} savingLabel={t("editProfile.saving")} />
        </form>
      </SectionCard>

      {/* REFERENCIAS */}
      <SectionCard
        title={t("editProfile.section_references")}
        description={t("editProfile.section_references_desc")}
      >
        {references.length === 0 ? (
          <p className="text-sm text-[#5C3A1E]/60">
            {t("editProfile.field_references_no_references")}
          </p>
        ) : (
          <form onSubmit={handleSaveReferences}>
            <div className="space-y-3">
              {references.map((ref, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border"
                  style={{ borderColor: "#D0622215", backgroundColor: "#FBF5E0" }}
                >
                  {/* AUTOR + BADGE VISIBILIDAD */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#D0622215", color: "#D06224" }}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2C1A0E]">
                        {ref.author_name || t("editProfile.anonymous")}
                      </p>
                      <p className="text-[11px] text-[#5C3A1E]/60">
                        {isWorker
                          ? t("editProfile.field_references_employer_review")
                          : t("editProfile.field_references_worker_review")}
                      </p>
                    </div>
                    {/* Badge estado actual */}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
                      style={
                        ref.visible !== false
                          ? { background: "#E8F5EE", color: "#2F855A" }
                          : { background: "#F5EDD6", color: "#8C6A10" }
                      }
                    >
                      {ref.visible !== false ? "Visible" : "Oculta"}
                    </span>
                  </div>

                  {/* CHIPS — positivos en verde, negativos en rojo */}
                  {isWorker ? (
                    <ReferenceChips
                      treatment={ref.treatment ?? ref.performance}
                      responsibility={ref.payment_responsibility ?? ref.punctuality}
                    />
                  ) : (
                    <ReferenceChips
                      treatment={ref.treatment ?? ref.performance}
                      responsibility={ref.payment_responsibility ?? ref.punctuality}
                    />
                  )}

                  {/* COMENTARIO LIBRE */}
                  {ref.review && (
                    <p className="text-xs text-[#5C3A1E] italic mt-1 mb-3 leading-relaxed">
                      "{ref.review}"
                    </p>
                  )}

                  {/* TOGGLE VISIBILIDAD — dentro de la tarjeta */}
                  <div
                    className="flex items-center justify-between pt-3 mt-3 border-t"
                    style={{ borderColor: "#D0622215" }}
                  >
                    <span className="text-xs text-[#5C3A1E]/70">
                      Mostrar en mi perfil público
                    </span>
                    <Toggle
                      value={ref.visible !== false}
                      onChange={(val) =>
                        setReferences((prev) =>
                          prev.map((r, idx) =>
                            idx === i ? { ...r, visible: val } : r
                          )
                        )
                      }
                      label=""
                    />
                  </div>
                </div>
              ))}
            </div>

            {referencesFeedback && (
              <div className="mt-4">
                <Toast type={referencesFeedback.type} message={referencesFeedback.message} />
              </div>
            )}
            <div className="mt-4">
              <SaveButton saving={savingReferences} label={t("editProfile.save_references")} savingLabel={t("editProfile.saving")} />
            </div>
          </form>
        )}
      </SectionCard>

      {/* SEGURIDAD */}
      <SectionCard title={t("editProfile.section_security")} description={t("editProfile.section_security_desc")}>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <Field label={t("editProfile.field_current_password")} icon={Lock}>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required
                className="w-full px-4 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                onBlur={(e) => (e.target.style.borderColor = "#D0622220")} />
              <button type="button" onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C3A1E]/40 hover:text-[#D06224] transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label={t("editProfile.field_new_password")} icon={Lock}>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} placeholder={t("editProfile.placeholder_min_password")} required
                className="w-full px-4 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
                style={inputBase}
                onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                onBlur={(e) => (e.target.style.borderColor = "#D0622220")} />
              <button type="button" onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C3A1E]/40 hover:text-[#D06224] transition-colors">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Field label={t("editProfile.field_confirm_password")} icon={Lock}>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("editProfile.placeholder_repeat_password")} required
                className="w-full px-4 pr-11 py-3 rounded-xl text-sm outline-none transition-all duration-200 text-[#2C1A0E]"
                style={{ ...inputBase, borderColor: confirmPassword && newPassword !== confirmPassword ? "#AE431E" : "#D0622220" }}
                onFocus={(e) => (e.target.style.borderColor = "#D06224")}
                onBlur={(e) => (e.target.style.borderColor = confirmPassword && newPassword !== confirmPassword ? "#AE431E" : "#D0622220")} />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C3A1E]/40 hover:text-[#D06224] transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs mt-1.5" style={{ color: "#AE431E" }}>{t("editProfile.password_mismatch")}</p>
            )}
          </Field>
          {passwordFeedback && <Toast type={passwordFeedback.type} message={passwordFeedback.message} />}
          <SaveButton saving={savingPassword} label={t("editProfile.save_password")} savingLabel={t("editProfile.saving")} />
        </form>
      </SectionCard>

        <WorkerAddWorkHistory open={openAddWorkHistory} onClose={() => setOpenAddWorkHistory(false)} onSubmit={handleAddWorkHistory} />

        {showFaceVerification && (
          <FaceVerification
            avatarUrl={avatarUrl}
            token={token}
            onVerified={() => {
              setFaceVerified(true);
              setShowFaceVerification(false);
            }}
            onClose={() => setShowFaceVerification(false)}
          />
        )}

      {showPlans && (
        <PlanSelector
          token={token}
          t={t}
          i18n={i18n}
          currentSubscription={subscription}
          onClose={() => setShowPlans(false)}
          onSubscribed={(sub) => {
            if (sub) setSubscription(sub);
            else {
              api.get("/api/users/subscription", token).then((d) => {
                if (!d.error) setSubscription(d.subscription);
              });
            }
          }}
        />
      )}
    </div>
  );
}