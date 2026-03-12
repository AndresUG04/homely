import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../config/supabase";
import { Bell } from "lucide-react";

export default function DashboardHeader() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const fetchName = async () => {
      const { data } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setFullName(data?.full_name || "");
    };
    if (user) fetchName();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const firstName = fullName.split(" ")[0];

  return (
    <header
      className="h-16 flex items-center justify-between px-8 border-b bg-white sticky top-0 z-30"
      style={{ borderColor: "#D0622215" }}
    >
      <div>
        <p className="text-base font-semibold text-[#2C1A0E]">
          {getGreeting()}, <span style={{ color: "#D06224" }}>{firstName}</span>{" "}
          👋
        </p>
        <p className="text-xs text-[#5C3A1E]/50">
          {new Date().toLocaleDateString("es-CR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#D06224]/10 relative"
          style={{ color: "#5C3A1E" }}
        >
          <Bell className="w-4 h-4" />
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D06224]" />
        </button>

        <div className="w-9 h-9 rounded-xl bg-[#D06224] flex items-center justify-center">
          <span className="text-sm font-bold text-[#FBF5E0]">
            {firstName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
