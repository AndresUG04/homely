import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-2">
          {t("dashboard.welcome")}
        </h1>
        <p className="text-gray-500 mb-6">{user?.email}</p>
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
        >
          {t("dashboard.signOut")}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;