import { useState } from "react";

export const WorkerAddJob = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    startDate: "",
    endDate: "",
    tasks: []
  });
  const [tasks, setTasks] = useState([
    "Limpiar cocina",
    "Cocinar",
    "Planchar"
  ]);
  const [newTask, setNewTask] = useState("");

  if (!open) return null;

  const addNewTask = () => {
    const task = newTask.trim();

    // evitar duplicados
    if (tasks.includes(task)) return;

    setTasks([...tasks, task]);

    // marcarla automáticamente como seleccionada
    setFormData({...formData,tasks: [...formData.tasks, task]});

    setNewTask("");
  };

  const handleTaskChange = (task) => {
    const exists = formData.tasks.includes(task);

    setFormData({
      ...formData,
      tasks: exists
        ? formData.tasks.filter(t => t !== task)
        : [...formData.tasks, task]
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); //se manda al padre
    setFormData({ title: "", company: "", description: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[400px] space-y-4">

        <h2 className="text-lg font-bold">Add Job</h2>

        <form onSubmit={handleSubmit} className="space-y-3">

          <input
            name="title"
            placeholder="Job Title"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={formData.title}
          />

          <input
            name="description"
            placeholder="Description"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={formData.description}
          />

          <div className="space-y-2">
            <p className="font-semibold">Tasks</p>

            {tasks.map((task, index) => (
              <label key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.tasks.includes(task)}
                  onChange={() => handleTaskChange(task)}
                />
                {task}
              </label>
            ))}

            <div className="flex gap-2 pt-2">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add new task"
                className="border p-1 rounded w-full"
              />

              <button
                type="button"
                onClick={addNewTask}
                className="bg-gray-200 px-2 rounded"
              >
                Add
              </button>
            </div>
          </div>

          <input
            type="date"
            name="startDate"
            placeholder="Start Date"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={formData.startDate}
          />

          <input
            type="date"
            name="endDate"
            placeholder="End Date"
            className="w-full border p-2 rounded"
            onChange={handleChange}
            value={formData.endDate}
          />

          <div className="flex justify-between pt-2">

            <button
              type="button"
              onClick={onClose}
              className="text-gray-500"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="bg-[#D06224] text-white px-4 py-2 rounded"
            >
              Save
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}