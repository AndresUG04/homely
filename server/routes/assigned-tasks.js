const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");
const notify = require("../utils/notify");

router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden asignar tareas" });
    }

    const { contract_id, name, date, start_time, end_time, description } = req.body;

    if (!contract_id || !name || !date || !start_time || !end_time) {
      return res.status(400).json({ error: "Los campos contract_id, name, date, start_time y end_time son requeridos" });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: "start_time debe ser anterior a end_time" });
    }

    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id, employer_user_id, employee_user_id, status")
      .eq("id", contract_id)
      .eq("employer_user_id", req.user.id)
      .eq("status", "accepted")
      .single();

    if (contractError || !contract) {
      return res.status(403).json({ error: "Contrato no encontrado o no autorizado" });
    }

    const { data: task, error: insertError } = await supabase
      .from("assigned_task")
      .insert({
        contract_id,
        name,
        description: description || null,
        date,
        start_time,
        end_time,
      })
      .select()
      .single();

    if (insertError || !task) {
      return res.status(500).json({ error: insertError?.message || "No se pudo crear la tarea" });
    }

    await notify({
      userId: contract.employee_user_id,
      title: "Nueva tarea asignada",
      message: `El empleador te ha asignado una tarea: ${name}`,
      type: "task_assigned",
      referenceId: task.id,
    });

    return res.status(201).json({ task });
  } catch (err) {
    console.error("[ASSIGNED-TASKS POST /] Server error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/employer", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden acceder a esta ruta" });
    }

    const { data: contracts, error: contractsError } = await supabase
      .from("contract")
      .select("id, employee_user_id")
      .eq("employer_user_id", req.user.id)
      .eq("status", "accepted");

    if (contractsError) {
      return res.status(500).json({ error: contractsError.message });
    }

    if (!contracts || contracts.length === 0) {
      return res.json({ tasks: [] });
    }

    const contractIds = contracts.map((c) => c.id);

    const { data: tasks, error: tasksError } = await supabase
      .from("assigned_task")
      .select("id, contract_id, name, description, date, start_time, end_time, status, created_at")
      .in("contract_id", contractIds)
      .order("date", { ascending: false });

    if (tasksError) {
      console.error("[ASSIGNED-TASKS GET /employer] Tasks query error:", tasksError.message);
      return res.json({ tasks: [] });
    }

    if (!tasks || tasks.length === 0) {
      return res.json({ tasks: [] });
    }

    const contractById = Object.fromEntries(contracts.map((c) => [c.id, c]));
    const contractIdsWithTasks = [...new Set(tasks.map((t) => t.contract_id))];
    const employeeIds = contractIdsWithTasks
      .map((cid) => contractById[cid]?.employee_user_id)
      .filter(Boolean);

    const { data: employees, error: employeesError } = await supabase
      .from("app_user")
      .select("id, full_name")
      .in("id", employeeIds);

    if (employeesError) {
      return res.status(500).json({ error: employeesError.message });
    }

    const employeeById = Object.fromEntries((employees || []).map((u) => [u.id, u]));

    const enrichedTasks = tasks.map((task) => {
      const contract = contractById[task.contract_id];
      const employee = contract ? employeeById[contract.employee_user_id] : null;
      return {
        ...task,
        worker_name: employee?.full_name || null,
      };
    });

    return res.json({ tasks: enrichedTasks });
  } catch (err) {
    console.error("[ASSIGNED-TASKS GET /employer] Server error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/employee", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo trabajadores pueden acceder a esta ruta" });
    }

    const { data: contracts, error: contractsError } = await supabase
      .from("contract")
      .select("id, employer_user_id")
      .eq("employee_user_id", req.user.id)
      .eq("status", "accepted");

    if (contractsError) {
      return res.status(500).json({ error: contractsError.message });
    }

    if (!contracts || contracts.length === 0) {
      return res.json({ tasks: [] });
    }

    const contractIds = contracts.map((c) => c.id);

    const { data: tasks, error: tasksError } = await supabase
      .from("assigned_task")
      .select("id, contract_id, name, description, date, start_time, end_time, status, created_at")
      .in("contract_id", contractIds)
      .order("date", { ascending: true });

    if (tasksError) {
      console.error("[ASSIGNED-TASKS GET /employee] Tasks query error:", tasksError.message);
      return res.json({ tasks: [] });
    }

    if (!tasks || tasks.length === 0) {
      return res.json({ tasks: [] });
    }

    const contractById = Object.fromEntries(contracts.map((c) => [c.id, c]));
    const contractIdsWithTasks = [...new Set(tasks.map((t) => t.contract_id))];
    const employerIds = contractIdsWithTasks
      .map((cid) => contractById[cid]?.employer_user_id)
      .filter(Boolean);

    const { data: employers, error: employersError } = await supabase
      .from("app_user")
      .select("id, full_name")
      .in("id", employerIds);

    if (employersError) {
      return res.status(500).json({ error: employersError.message });
    }

    const employerById = Object.fromEntries((employers || []).map((u) => [u.id, u]));

    const enrichedTasks = tasks.map((task) => {
      const contract = contractById[task.contract_id];
      const employer = contract ? employerById[contract.employer_user_id] : null;
      return {
        ...task,
        employer_name: employer?.full_name || null,
      };
    });

    return res.json({ tasks: enrichedTasks });
  } catch (err) {
    console.error("[ASSIGNED-TASKS GET /employee] Server error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo trabajadores pueden actualizar el estado de tareas" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Estado inválido. Debe ser: pending, in_progress o completed" });
    }

    const { data: task, error: taskError } = await supabase
      .from("assigned_task")
      .select("id, contract_id")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id, employee_user_id")
      .eq("id", task.contract_id)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }

    if (contract.employee_user_id !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para actualizar esta tarea" });
    }

    const { data: updated, error: updateError } = await supabase
      .from("assigned_task")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({ task: updated });
  } catch (err) {
    console.error("[ASSIGNED-TASKS PATCH /:id/status] Server error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden eliminar tareas" });
    }

    const { id } = req.params;

    const { data: task, error: taskError } = await supabase
      .from("assigned_task")
      .select("id, contract_id, name")
      .eq("id", id)
      .single();

    if (taskError || !task) {
      return res.status(404).json({ error: "Tarea no encontrada" });
    }

    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id, employer_user_id, employee_user_id")
      .eq("id", task.contract_id)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }

    if (contract.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "No autorizado para eliminar esta tarea" });
    }

    const { error: deleteError } = await supabase
      .from("assigned_task")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    await notify({
      userId: contract.employee_user_id,
      title: "Tarea cancelada",
      message: `El empleador ha cancelado la tarea: ${task.name}`,
      type: "task_deleted",
      referenceId: task.id,
    });

    return res.json({ message: "Tarea eliminada" });
  } catch (err) {
    console.error("[ASSIGNED-TASKS DELETE /:id] Server error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
