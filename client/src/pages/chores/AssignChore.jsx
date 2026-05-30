import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../config/api";

export default function AssignChore({ onTaskCreated }) {
  const { token } = useAuth();

  const [form, setForm] = useState({
    contract_id: "",
    name: "",
    date: "",
    start_time: "",
    end_time: "",
    description: "",
  });
  const [contracts, setContracts] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [contractsError, setContractsError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    const loadContracts = async () => {
      setContractsLoading(true);
      try {
        const data = await api.get("/api/contracts/my", token);
        if (data.error) {
          setContractsError("No se pudieron cargar los contratos. Intenta nuevamente.");
        } else {
          const accepted = (data.contracts || []).filter(c => c.status === "accepted");
          setContracts(accepted);
        }
      } catch {
        setContractsError("No se pudieron cargar los contratos. Intenta nuevamente.");
      } finally {
        setContractsLoading(false);
      }
    };
    loadContracts();
  }, [token]);

  useEffect(() => {
    if (!success) return;
    const id = setTimeout(() => setSuccess(false), 3000);
    return () => clearTimeout(id);
  }, [success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.contract_id) newErrors.contract_id = "Selecciona una trabajadora";
    if (!form.name.trim()) newErrors.name = "El nombre de la tarea es requerido";
    if (!form.date) newErrors.date = "La fecha es requerida";
    if (!form.start_time) newErrors.start_time = "La hora de inicio es requerida";
    if (!form.end_time) {
      newErrors.end_time = "La hora de fin es requerida";
    } else if (form.start_time && form.end_time <= form.start_time) {
      newErrors.end_time = "La hora de fin debe ser posterior a la hora de inicio";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await api.post("/api/assigned-tasks", form, token);
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setSubmitError("");
      setSuccess(true);
      onTaskCreated?.();
      setForm({
        contract_id: "",
        name: "",
        date: "",
        start_time: "",
        end_time: "",
        description: "",
      });
    } catch {
      setSubmitError("Error al asignar la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-3xl font-bold text-[#2C1A0E]"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Asignar Tarea
        </h1>
        <p className="text-sm text-[#5C3A1E]/60 mt-1">
          Asigna una tarea doméstica a una de tus trabajadoras activas
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium text-sm">
          ✓ Tarea asignada correctamente
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {submitError}
        </div>
      )}

      {/* Contracts loading spinner */}
      {contractsLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-[#D06224] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contractsError ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
          {contractsError}
        </div>
      ) : contracts.length === 0 ? (
        <div className="bg-[#FBF5E0] rounded-2xl p-6">
          <p className="text-sm text-[#5C3A1E]/70 text-center">
            No tienes contratos activos con trabajadoras
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Trabajadora + Tarea */}
          <div className="bg-[#FBF5E0] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">
              Información de la Tarea
            </h2>
            <div className="space-y-4">
              {/* Trabajadora */}
              <div>
                <label className="block text-sm font-medium text-[#5C3A1E] mb-2">
                  Trabajadora <span className="text-red-500">*</span>
                </label>
                <select
                  name="contract_id"
                  value={form.contract_id}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors text-[#2C1A0E]"
                >
                  <option value="">Selecciona una trabajadora</option>
                  {contracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.employee?.user?.full_name || "Sin nombre"}
                    </option>
                  ))}
                </select>
                {errors.contract_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.contract_id}</p>
                )}
              </div>

              {/* Nombre de tarea */}
              <div>
                <label className="block text-sm font-medium text-[#5C3A1E] mb-2">
                  Nombre de tarea <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: Limpiar la cocina"
                  className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-[#5C3A1E] mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detalles adicionales sobre la tarea..."
                  rows="3"
                  className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Fecha y Horario */}
          <div className="bg-[#FBF5E0] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">
              Fecha y Horario
            </h2>
            <div className="space-y-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-[#5C3A1E] mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              {/* Hora inicio y fin */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">
                    Hora de inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                  />
                  {errors.start_time && (
                    <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5C3A1E] mb-2">
                    Hora de fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    className="w-full p-3 rounded-xl text-sm outline-none border-2 border-[#D06224]/20 bg-white focus:border-[#D06224] transition-colors"
                  />
                  {errors.end_time && (
                    <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
              style={{
                backgroundColor: "#D06224",
                boxShadow: "0 8px 24px rgba(208,98,36,0.35)",
              }}
            >
              {loading ? "Asignando..." : "Asignar Tarea"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
