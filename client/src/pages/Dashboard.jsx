import { useAuth } from "../context/AuthContext";
import EmployerDashboard from "../components/dashboard/EmployerDashboard";
import WorkerDashboard from "../components/dashboard/WorkerDashboard";
import { useEffect, useState } from "react";
import { supabase } from "../config/supabase";

export default function Dashboard() {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      setRole(data?.role);
      setLoading(false);
    };
    if (user) fetchRole();
  }, [user]);

  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#FBF5E0" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D06224] animate-pulse" />
          <p className="text-sm text-[#5C3A1E]/60 font-medium">Cargando...</p>
        </div>
      </div>
    );

  return role === "employer" ? <EmployerDashboard /> : <WorkerDashboard />;
}
