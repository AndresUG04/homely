import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { WorkerAddWorkHistory } from "./WorkerAddWorkHistory";
import { api } from "../../config/api";
import {
  User, Mail, Shield, Lock, CheckCircle, AlertCircle, Save,
  Eye, EyeOff, Phone, Hash, Globe, MapPin, AlignLeft, Briefcase, FolderOpen, Star
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
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}>
      <div className="mb-5 pb-4 border-b" style={{ borderColor: "#D0622210" }}>
        <h2 className="text-base font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>{title}</h2>
        {description && <p className="text-xs text-[#5C3A1E]/50 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-[#2C1A0E]">
        <Icon className="w-3.5 h-3.5 text-[#D06224]" />{label}
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
      <span className="text-sm text-[#5C3A1E]/70">{label}</span>
    </div>
  );
}

export default function EditProfile() {
  const { profile, token, setProfile } = useAuth();
  const { t } = useTranslation();

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
  const [privacyFeedback, setPrivacyFeedback] = useState(null);
  const [referencesFeedback, setReferencesFeedback] = useState(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savingReferences, setSavingReferences] = useState(false);

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
       setReferences(u.references || []);
      }
      setLoadingProfile(false);
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
    setTimeout(() => {
      setPrivacyFeedback(null);
    }, 2000);
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

  const SaveButton = ({ saving, label }) => (
    <div className="flex justify-end pt-1">
      <button type="submit" disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
        style={{ backgroundColor: saving ? "#D0622470" : "#D06224", boxShadow: saving ? "none" : "0 6px 20px rgba(208,98,36,0.30)" }}>
        <Save className="w-4 h-4" />
        {saving ? t("editProfile.saving") : label}
      </button>
    </div>
  );

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#D06224]/20 border-t-[#D06224] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("editProfile.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">{t("editProfile.subtitle")}</p>
      </div>

      <div className="rounded-2xl px-6 py-5 flex items-center gap-5"
        style={{
          background: isWorker ? "linear-gradient(135deg, #8A8635 0%, #6B6828 100%)" : "linear-gradient(135deg, #D06224 0%, #AE431E 100%)",
          boxShadow: isWorker ? "0 8px 24px rgba(138,134,53,0.25)" : "0 8px 24px rgba(208,98,36,0.25)",
        }}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-2xl font-bold text-[#FBF5E0]" style={{ fontFamily: "'Fraunces', serif" }}>{initials}</span>
        </div>
        <div>
          <p className="text-lg font-bold text-[#FBF5E0]" style={{ fontFamily: "'Fraunces', serif" }}>{formData.full_name || "—"}</p>
          <p className="text-[#FBF5E0]/70 text-sm">{profile?.email}</p>
          <span className="inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(251,245,224,0.2)", color: "#FBF5E0" }}>
            {ROLE_LABELS[profile?.role] || profile?.role}
          </span>
        </div>
      </div>

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
          <SaveButton saving={savingProfile} label={t("editProfile.save_changes")} />
        </form>
      </SectionCard>
      {/* DIRECCION */}
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
          <SaveButton saving={savingProfile} label={t("editProfile.save_address")} />
        </form>
      </SectionCard>

      {/* PERFIL PORTATIL */}
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
                  <div key={job.id} className="p-4 rounded-xl border relative"
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
                      {job.work_history_task.map((t, i) => (
                      <div key={i}
                        className="flex flex-col gap-0.5 px-3 py-2 rounded-lg text-xs"
                        style={{ backgroundColor: "#8A863515", color: "#8A8635" }}>
                        <span className="font-medium leading-snug">{t.task?.name}</span>
                        {t.task?.description && (
                          <span
                            className="leading-snug"
                            style={{ color: "#8A8635", opacity: 0.65 }}
                          >
                            {t.task?.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  </div>
                ))}
              </div>
            )}
            <SaveButton saving={savingProfile} label={t("editProfile.save_portable")} />
          </form>
        </SectionCard>
      )}
      
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
            <SaveButton saving={savingProfile} label={t("editProfile.save_description")} />
          </form>
        </SectionCard>
      )}

      {/* PRIVACIDAD */}
      <SectionCard title={t("editProfile.section_privacy")} description={t("editProfile.section_privacy_desc")}>
        <form onSubmit={handleSavePrivacy} className="space-y-4">
          {[
            { key: "email",        label: t("editProfile.field_email"),        icon: Mail      },
            { key: "phone",        label: t("editProfile.field_phone"),        icon: Phone     },
            { key: "age",          label: t("editProfile.field_age"),          icon: Hash      },
            { key: "address",      label: t("editProfile.section_address"),    icon: MapPin    },
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
          <SaveButton saving={savingPrivacy} label={t("editProfile.save_privacy")} />
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
                  className="p-4 rounded-xl border relative"
                  style={{
                    borderColor: "#D0622215",
                    backgroundColor: "#FBF5E0",
                  }}
                >
                  {/* HEADER AUTOR */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: "#D0622215",
                        color: "#D06224",
                      }}
                    >
                      <User className="w-4 h-4" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#2C1A0E]">
                        {ref.author_name || t("editProfile.anonymous")}
                      </p>

                      <p className="text-[11px] text-[#5C3A1E]/60">
                        {isWorker ? t("editProfile.field_references_employer_review") : t("editProfile.field_references_worker_review")}
                      </p>
                    </div>
                  </div>

                  {/* CONTENIDO */}
                  {isWorker ? (
                    <>
                      {ref.performance && (
                        <p className="text-xs text-[#5C3A1E]">
                          <strong>{t("editProfile.field_references_performance")}:</strong>{" "}
                          {ref.performance}
                        </p>
                      )}
                      {ref.punctuality && (
                        <p className="text-xs text-[#5C3A1E]">
                          <strong>{t("editProfile.field_references_punctuality")}:</strong>{" "}
                          {ref.punctuality}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {ref.treatment && (
                        <p className="text-xs text-[#5C3A1E]">
                          <strong>{t("editProfile.field_references_treatment")}:</strong>{" "}
                          {ref.treatment}
                        </p>
                      )}
                      {ref.payment_responsibility && (
                        <p className="text-xs text-[#5C3A1E]">
                          <strong>
                            {t("editProfile.field_references_payment_responsibility")}:
                          </strong>{" "}
                          {ref.payment_responsibility}
                        </p>
                      )}
                    </>
                  )}

                  {/* REVIEW */}
                  {ref.review && (
                    <p className="text-sm mt-2 text-[#5C3A1E] italic">
                      “{ref.review}”
                    </p>
                  )}

                  {/* VISIBILITY TOGGLE */}
                  <div className="mt-4">
                    <Toggle
                      value={ref.visible !== false}
                      onChange={(val) => {
                        setReferences((prev) =>
                          prev.map((r, idx) =>
                            idx === i ? { ...r, visible: val } : r
                          )
                        );
                      }}
                      label={
                        ref.visible !== false
                          ? t("editProfile.field_reference_visible")
                          : t("editProfile.field_reference_hidden")
                      }
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
            {/* BOTÓN GUARDAR */}
             <div className="mt-4">
              <SaveButton saving={savingReferences} label={t("editProfile.save_references")} />
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
          <SaveButton saving={savingPassword} label={t("editProfile.save_password")} />
        </form>
      </SectionCard>

      <WorkerAddWorkHistory open={openAddWorkHistory} onClose={() => setOpenAddWorkHistory(false)} onSubmit={handleAddWorkHistory} />
    </div>
  );
}