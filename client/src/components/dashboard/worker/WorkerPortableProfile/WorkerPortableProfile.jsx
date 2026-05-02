import { useAuth } from "../../../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../../../config/supabase";
import { ArrowRight } from "lucide-react";
import { WorkerAddJob } from "./WorkerAddJob";
import { useTranslation } from "react-i18next";

export default function WorkerPortableProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const [fullName, setFullName] = useState("");
  const [openForm, setOpenForm] = useState(false);

  const handleSaveJob = (data) => {
    console.log("JOB DATA:", data);
  };

  useEffect(() => {
    const fetchName = async () => {
      const { data } = await supabase
        .from("app_user")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setFullName(data?.full_name || "");
    };
    if (user) fetchName();
  }, [user]);

  const quickActions = [
    { label: t("workerPortableProfile.addJob"), color: "#D06224" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {t("workerPortableProfile.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {t("workerPortableProfile.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <h2
            className="text-base font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("workerPortableProfile.actions")}
          </h2>
          <div className="space-y-3">
            {quickActions.map(({ label, color }) => (
              <button
                key={label}
                onClick={() => setOpenForm(true)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: `${color}10`, color }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="bg-white rounded-2xl p-6"
          style={{ boxShadow: "0 2px 12px rgba(208,98,36,0.08)" }}
        >
          <h2
            className="text-base font-bold text-[#2C1A0E] mb-4"
            style={{ fontFamily: "'Fraunces', serif" }}
          >
            {t("workerPortableProfile.jobsList")}
          </h2>
        </div>
      </div>

      <WorkerAddJob
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSaveJob}
      />
    </div>
  );
}