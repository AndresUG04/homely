import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export const WorkerAddWorkHistory = ({ open, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    startDate: "",
    endDate: "",
    status: "",
    tasks: []
  });

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    name: "",
    description: ""
  });

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [open]);

  if (!open) return null;

  const inputStyle = {
    border: "2px solid #D0622220",
    backgroundColor: "#FBF5E0"
  };

  const addNewTask = () => {
    const name = newTask.name.trim();
    const description = newTask.description.trim();

    if (!name) return;
    if (tasks.some(t => t.name === name)) return;

    const task = {
      name,
      description,
      task_type: "default"
    };

    setTasks([...tasks, task]);

    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, task]
    }));

    setNewTask({ name: "", description: "" });
  };

  const handleTaskChange = (task) => {
    const exists = formData.tasks.some(t => t.name === task.name);

    setFormData({
      ...formData,
      tasks: exists
        ? formData.tasks.filter(t => t.name !== task.name)
        : [...formData.tasks, task]
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSubmit(formData);

      setFormData({
        title: "",
        company: "",
        description: "",
        startDate: "",
        endDate: "",
        tasks: []
      });

      setTasks([]);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {saving && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
          <div className="w-10 h-10 border-4 border-[#D06224]/20 border-t-[#D06224] rounded-full animate-spin" />
        </div>
      )}

      <div
        className="relative w-[420px] rounded-2xl p-6 space-y-4 bg-white shadow-lg"
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "0 10px 30px rgba(44,26,14,0.15)"
        }}
      >

        <h2
          className="text-lg font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          {t("workHistory.addTitle")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* TITLE */}
          <input
            name="title"
            disabled={saving}
            placeholder={t("workHistory.titlePlaceholder")}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none text-[#2C1A0E]"
            style={inputStyle}
            onChange={handleChange}
            value={formData.title}
          />

          <input
            name="description"
            disabled={saving}
            placeholder={t("workHistory.descriptionPlaceholder")}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none text-[#2C1A0E]"
            style={inputStyle}
            onChange={handleChange}
            value={formData.description}
          />

          <div className="space-y-2">

            <p className="text-sm font-semibold text-[#2C1A0E]">
              {t("workHistory.tasks")}
            </p>

            {tasks.map((task, index) => (
              <label
                key={index}
                className="flex items-start gap-2 text-sm text-[#2C1A0E]"
              >
                <input
                  type="checkbox"
                  checked={formData.tasks.some(t => t.name === task.name)}
                  onChange={() => handleTaskChange(task)}
                  className="accent-[#D06224]"
                />
                <div>
                  <p className="font-medium">{task.name}</p>
                  {task.description && (
                    <p className="text-xs text-[#5C3A1E]/60">
                      {task.description}
                    </p>
                  )}
                </div>
              </label>
            ))}

            <div className="pt-2 space-y-2 border-t border-[#D0622210]">

              <input
                value={newTask.name}
                onChange={(e) =>
                  setNewTask({ ...newTask, name: e.target.value })
                }
                disabled={saving}
                placeholder={t("workHistory.taskNamePlaceholder")}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none text-[#2C1A0E]"
                style={inputStyle}
              />

              <input
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                disabled={saving}
                placeholder={t("workHistory.taskDescriptionPlaceholder")}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none text-[#2C1A0E]"
                style={inputStyle}
              />

              <button
                type="button"
                disabled={saving}
                onClick={addNewTask}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white"
                style={{
                  backgroundColor: "#8A8635",
                  boxShadow: "0 6px 18px rgba(138,134,53,0.25)"
                }}
              >
                {t("workHistory.addTask")}
              </button>

            </div>
          </div>

          <p className="text-sm font-semibold text-[#2C1A0E]">
            {t("workHistory.from")}
          </p>
          <input
            type="date"
            name="startDate"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none text-[#2C1A0E]"
            style={inputStyle}
            onChange={handleChange}
            value={formData.startDate}
          />

          <p className="text-sm font-semibold text-[#2C1A0E]">
            {t("workHistory.to")}
          </p>
          <input
            type="date"
            name="endDate"
            className="w-full px-4 py-3 rounded-xl text-sm outline-none text-[#2C1A0E]"
            style={inputStyle}
            onChange={handleChange}
            value={formData.endDate}
          />

          <div className="flex justify-between pt-2">

            <button
              type="button"
              onClick={onClose}
              className="text-sm text-[#5C3A1E]/60 hover:text-[#2C1A0E]"
            >
              {t("workHistory.cancel")}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{
                backgroundColor: "#D06224",
                boxShadow: "0 6px 20px rgba(208,98,36,0.30)"
              }}
            >
              {saving ? t("workHistory.saving") : t("workHistory.save")}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};