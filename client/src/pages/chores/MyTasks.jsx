import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { api } from "../../config/api";
import { STATUS_CONFIG, formatDate, formatTime } from "./choreUtils";

function TaskCard({ task, onStatusUpdate }) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");

  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  const handleStatusChange = async (newStatus) => {
    if (updating) return;
    setUpdating(true);
    setActionError("");

    onStatusUpdate(task.id, newStatus);

    const result = await api.patch(
      `/api/assigned-tasks/${task.id}/status`,
      { status: newStatus },
      token
    );

    if (result.error) {
      onStatusUpdate(task.id, task.status);
      setActionError(result.error);
    }

    setUpdating(false);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#D06224]/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#2C1A0E]">{task.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.className}`}>
              {t(`myTasks.status.${task.status}`, { defaultValue: statusConfig.label })}
            </span>
          </div>

          <p className="text-xs text-[#5C3A1E]/50 mt-0.5">
            {t("myTasks.assigned_by", { name: task.employer_name })}
          </p>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#5C3A1E]/60 flex-wrap">
            <span>{formatDate(task.date)}</span>
            <span>·</span>
            <span>{formatTime(task.start_time)} – {formatTime(task.end_time)}</span>
          </div>

          {task.description && (
            <p className="mt-2 text-sm text-[#5C3A1E]/70 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action button */}
        <div className="flex-shrink-0">
          {task.status === "pending" && (
            <button
              onClick={() => handleStatusChange("in_progress")}
              disabled={updating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#D06224] text-[#D06224] hover:bg-[#D06224]/5 transition-colors disabled:opacity-50"
            >
              {updating ? t("myTasks.starting") : t("myTasks.start")}
            </button>
          )}
          {task.status === "in_progress" && (
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={updating}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D06224] text-white hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {updating ? t("myTasks.completing") : t("myTasks.complete")}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {actionError}
        </p>
      )}
    </div>
  );
}

export default function MyTasks() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/assigned-tasks/employee", token);
      if (data.error) {
        setError(t("myTasks.load_error"));
      } else {
        setTasks(data.tasks || []);
      }
    } catch {
      setError(t("myTasks.load_error"));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusUpdate = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
          {t("myTasks.title")}
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          {t("myTasks.subtitle")}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-[#D06224] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadTasks} className="text-sm font-semibold underline ml-4 hover:opacity-70">
            {t("myTasks.retry")}
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <span className="text-4xl">✅</span>
          <p className="text-sm text-[#5C3A1E]/60">{t("myTasks.empty")}</p>
        </div>
      )}

      {/* Task list */}
      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusUpdate={handleStatusUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}