import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { STATUS_CONFIG, formatDate, formatTime } from "./choreUtils";

function TaskCard({ task, onDelete }) {
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { token } = useAuth();

  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    setDeleting(true);
    setDeleteError("");
    const result = await api.delete(`/api/assigned-tasks/${task.id}`, token);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
    } else {
      onDelete(task.id);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#D06224]/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#2C1A0E]">{task.name}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#5C3A1E]/60 flex-wrap">
            <span>{formatDate(task.date)}</span>
            <span>·</span>
            <span>
              {formatTime(task.start_time)} – {formatTime(task.end_time)}
            </span>
          </div>

          {task.description && (
            <p className="mt-2 text-sm text-[#5C3A1E]/70 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>

      {deleteError && (
        <p className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          {deleteError}
        </p>
      )}
    </div>
  );
}

export default function MyAssignedTasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/assigned-tasks/employer", token);
      if (data.error) {
        setError("No se pudieron cargar las tareas. Intenta nuevamente.");
      } else {
        setTasks(data.tasks || []);
      }
    } catch {
      setError("No se pudieron cargar las tareas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleDelete = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Group tasks by worker_name
  const grouped = tasks.reduce((acc, task) => {
    const key = task.worker_name || "Sin nombre";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const workerNames = Object.keys(grouped).sort();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Tareas Asignadas
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          Revisa y gestiona las tareas que has asignado a tus trabajadoras
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
          <button
            onClick={loadTasks}
            className="text-sm font-semibold underline ml-4 hover:opacity-70"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <span className="text-4xl">📋</span>
          <p className="text-sm text-[#5C3A1E]/60">No has asignado tareas aún</p>
        </div>
      )}

      {/* Grouped task list */}
      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-8">
          {workerNames.map((workerName) => (
            <div key={workerName}>
              <h2
                className="text-lg font-bold text-[#2C1A0E] mb-4"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {workerName}
              </h2>
              <div className="space-y-3">
                {grouped[workerName].map((task) => (
                  <TaskCard key={task.id} task={task} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
