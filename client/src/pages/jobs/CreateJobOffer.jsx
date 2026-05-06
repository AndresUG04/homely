import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";
import { Plus, Trash2, X } from "lucide-react";

const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const SCHEDULE_TYPES = [
  { value: "Tiempo completo", label: "Tiempo completo" },
  { value: "Medio tiempo", label: "Medio tiempo" },
];

export default function CreateJobOffer() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary: "",
    expiration_date: "",
    schedule_type: "",
    schedule_details: [],
    address: { country: "", state: "", city: "", address_line_1: "" },
    selectedTaskIds: [],
  });

  const [availableTasks, setAvailableTasks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(isEditing);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (user?.role !== "employer") { navigate("/unauthorized"); return; }
    loadTasks();
    if (isEditing) loadJobForEdit();
  }, [user, editId]);

  const loadTasks = async () => {
    const { tasks, error } = await api.get("/api/tasks", token);
    if (!error && tasks) setAvailableTasks(tasks);
  };

  const loadJobForEdit = async () => {
    try {
      const { job, error } = await api.get(`/api/jobs/${editId}`, token);
      if (error || !job) { navigate("/jobs/mine"); return; }
      setFormData({
        title: job.title || "",
        description: job.description || "",
        salary: job.salary?.toString() || "",
        expiration_date: job.expiration_date || "",
        schedule_type: job.schedule?.schedule_type || "",
        schedule_details: job.schedule?.schedule_details || [],
        address: {
          country: job.address?.country || "",
          state: job.address?.state || "",
          city: job.address?.city || "",
          address_line_1: job.address?.address_line_1 || "",
        },
        selectedTaskIds: job.job_offer_tasks?.map(jot => jot.task?.id).filter(Boolean) || [],
      });
    } catch { navigate("/jobs/mine"); }
    finally { setFetchingJob(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    if (errors[`address_${name}`]) setErrors(prev => ({ ...prev, [`address_${name}`]: "" }));
  };

  const addScheduleDay = () => {
    setFormData(prev => ({
      ...prev,
      schedule_details: [...prev.schedule_details, { week_day: "Lunes", start_time: "08:00", end_time: "16:00" }]
    }));
  };

  const updateScheduleDay = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule_details: prev.schedule_details.map((day, i) => i === index ? { ...day, [field]: value } : day)
    }));
  };

  const removeScheduleDay = (index) => {
    setFormData(prev => ({ ...prev, schedule_details: prev.schedule_details.filter((_, i) => i !== index) }));
  };

  const toggleTask = (taskId) => {
    setFormData(prev => ({
      ...prev,
      selectedTaskIds: prev.selectedTaskIds.includes(taskId)
        ? prev.selectedTaskIds.filter(id => id !== taskId)
        : [...prev.selectedTaskIds, taskId]
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "El título es requerido";
    if (!formData.description.trim()) newErrors.description = "La descripción es requerida";
    if (!formData.salary.trim()) newErrors.salary = "El salario es requerido";
    else if (isNaN(formData.salary) || parseFloat(formData.salary) <= 0) newErrors.salary = "El salario debe ser positivo";
    if (!formData.schedule_type) newErrors.schedule_type = "Seleccione un tipo de horario";
    if (formData.schedule_details.length === 0) newErrors.schedule_details = "Agregue al menos un día";
    if (!formData.address.country.trim()) newErrors.address_country = "El país es requerido";
    if (!formData.address.state.trim()) newErrors.address_state = "La provincia es requerida";
    if (!formData.address.city.trim()) newErrors.address_city = "El cantón es requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      salary: parseFloat(formData.salary),
      schedule: { schedule_type: formData.schedule_type, details: formData.schedule_details },
      address: {
        country: formData.address.country.trim(),
        state: formData.address.state.trim(),
        city: formData.address.city.trim(),
        address_line_1: formData.address.address_line_1.trim(),
      },
      tasks: formData.selectedTaskIds.map(id => {
        const task = availableTasks.find(t => t.id === id);
        return { name: task?.name || "", description: task?.description || "" };
      }).filter(t => t.name),
    };
    if (formData.expiration_date) payload.expiration_date = formData.expiration_date;

    try {
      const endpoint = isEditing ? `/api/jobs/${editId}` : "/api/jobs";
      const method = isEditing ? "put" : "post";
      const { error } = await api[method](endpoint, payload, token);
      if (error) setSubmitError(error);
      else navigate("/jobs/mine");
    } catch {
      setSubmitError(isEditing ? "Error al actualizar" : "Error al crear");
    } finally {
      setLoading(false);
    }
  };

  const selectedTasks = availableTasks.filter(t => formData.selectedTaskIds.includes(t.id));
  const unselectedTasks = availableTasks.filter(t => !formData.selectedTaskIds.includes(t.id));

  if (fetchingJob) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-xl animate-pulse" style={{ backgroundColor: "#D06224" }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]" style={{ fontFamily: "'Fraunces', serif" }}>
            {isEditing ? "Editar Oferta" : "Crear Oferta de Trabajo"}
          </h1>
          <p className="text-sm text-[#5C3A1E]/60 mt-1">
            {isEditing ? "Actualiza los detalles de tu oferta" : "Publica una nueva oferta para atraer candidatos"}
          </p>
        </div>
      </div>

          {submitError && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 border border-red-200">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información Básica */}
            <div className="bg-[#FBF5E0] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Información Básica</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Título</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ej: Niñera fines de semana"
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Descripción</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe las responsabilidades y requisitos..."
                    rows="4"
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors resize-none"
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Salario (por hora)</label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="500"
                      min="0"
                      step="0.01"
                      className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                    />
                    {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Fecha de Expiración</label>
                    <input
                      type="date"
                      name="expiration_date"
                      value={formData.expiration_date}
                      onChange={handleChange}
                      className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Horario */}
            <div className="bg-[#FBF5E0] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Horario</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Tipo de Horario</label>
                  <select
                    value={formData.schedule_type}
                    onChange={e => setFormData(prev => ({ ...prev, schedule_type: e.target.value, schedule_details: [] }))}
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors text-[#2C1A0E]"
                  >
                    <option value="">Seleccionar tipo</option>
                    {SCHEDULE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.schedule_type && <p className="text-red-500 text-xs mt-1">{errors.schedule_type}</p>}
                </div>

                {formData.schedule_type && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[#5C3A1E]">Días y Horarios</span>
                      <button
                        type="button"
                        onClick={addScheduleDay}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#D06224] border-2 border-[#D06224]/20 hover:bg-[#D06224]/5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Día
                      </button>
                    </div>
                    {formData.schedule_details.map((day, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-white mb-3 border border-[#D06224]/10">
                        <select
                          value={day.week_day}
                          onChange={e => updateScheduleDay(index, "week_day", e.target.value)}
                          className="flex-1 p-2 rounded-lg text-sm border border-gray-200 bg-white"
                        >
                          {WEEK_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input
                          type="time"
                          value={day.start_time}
                          onChange={e => updateScheduleDay(index, "start_time", e.target.value)}
                          className="p-2 rounded-lg text-sm border border-gray-200 bg-white"
                        />
                        <span className="text-[#5C3A1E]/60">-</span>
                        <input
                          type="time"
                          value={day.end_time}
                          onChange={e => updateScheduleDay(index, "end_time", e.target.value)}
                          className="p-2 rounded-lg text-sm border border-gray-200 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeScheduleDay(index)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {errors.schedule_details && <p className="text-red-500 text-xs mt-1">{errors.schedule_details}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-[#FBF5E0] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Dirección</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">País</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.address.country}
                    onChange={handleAddressChange}
                    placeholder="Costa Rica"
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                  />
                  {errors.address_country && <p className="text-red-500 text-xs mt-1">{errors.address_country}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Provincia</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.address.state}
                    onChange={handleAddressChange}
                    placeholder="San José"
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                  />
                  {errors.address_state && <p className="text-red-500 text-xs mt-1">{errors.address_state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Cantón</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.address.city}
                    onChange={handleAddressChange}
                    placeholder="Escazú"
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                  />
                  {errors.address_city && <p className="text-red-500 text-xs mt-1">{errors.address_city}</p>}
                </div>
              </div>
            </div>

            {/* Tareas */}
            <div className="bg-[#FBF5E0] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Tareas</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">Agregar Tarea</label>
                  <select
                    value=""
                    onChange={e => { if (e.target.value) toggleTask(e.target.value); }}
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors text-[#2C1A0E]"
                  >
                    <option value="">Seleccionar tarea...</option>
                    {unselectedTasks.map(task => (
                      <option key={task.id} value={task.id}>{task.name}</option>
                    ))}
                  </select>
                </div>

                {selectedTasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-[#5C3A1E] mb-2">Tareas Seleccionadas</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTasks.map(task => (
                        <span
                          key={task.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#D06224]/20 text-sm text-[#2C1A0E]"
                        >
                          {task.name}
                          <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className="text-[#D06224] hover:text-[#D06224]/70"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/jobs/mine")}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-[#5C3A1E] border-2 border-[#5C3A1E]/20 hover:bg-[#5C3A1E]/5 transition-colors"
              >
                Regresar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "#D06224", boxShadow: "0 8px 24px rgba(208,98,36,0.35)" }}
              >
                {loading ? "..." : (isEditing ? "Actualizar Oferta" : "Crear Oferta")}
              </button>
            </div>
          </form>
      </div>
  );
}
