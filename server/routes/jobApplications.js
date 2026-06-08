const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// GET /api/job-applications/my
// Employee sees their own applications
router.get("/my", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados pueden ver sus postulaciones" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .select(`
        id,
        status,
        created_at,
        job_offer_id,
        job_offer:job_offer(
          id,
          title,
          description,
          salary
        )
      `)
      .eq("employee_user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ applications: data || [] });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/job-applications/job/:jobId
// Employer sees applicants for a specific job offer
router.get("/job/:jobId", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden ver postulantes" });
    }

    const { jobId } = req.params;

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id")
      .eq("id", jobId)
      .eq("employer_user_id", req.user.id)
      .single();

    if (jobError || !job) {
      return res.status(403).json({ error: "La oferta no existe o no te pertenece" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .select("id, status, created_at, employee_user_id")
      .eq("job_offer_id", jobId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const userIds = (data || []).map((a) => a.employee_user_id);
    let userMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("app_user")
        .select("id, full_name, email, phone")
        .in("id", userIds);
      userMap = Object.fromEntries((users || []).map((u) => [u.id, u]));
    }

    const applications = (data || []).map((app) => ({
      ...app,
      employee: { user: userMap[app.employee_user_id] || {} },
    }));

    return res.json({ applications });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/job-applications/:id
// Get a specific application (accessible by the employee or the job's employer)
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("job_offer_application")
      .select(`
        id,
        status,
        created_at,
        job_offer_id,
        employee_user_id,
        job_offer:job_offer(
          id,
          title,
          description,
          salary,
          employer_user_id
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    const isEmployee = req.user.id === data.employee_user_id;
    const isEmployer = req.user.id === data.job_offer?.employer_user_id;
    if (!isEmployee && !isEmployer) {
      return res.status(403).json({ error: "No tienes acceso a esta postulación" });
    }

    return res.json({ application: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/job-applications
// Employee applies to a job offer
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados pueden postularse" });
    }

    const { job_offer_id } = req.body;
    if (!job_offer_id) {
      return res.status(400).json({ error: "job_offer_id es requerido" });
    }

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id, status")
      .eq("id", job_offer_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ error: "Esta oferta no está disponible" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .insert({ job_offer_id, employee_user_id: req.user.id, status: "Pendiente" })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Ya te postulaste a esta oferta" });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ application: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/job-applications/:id
// Employer updates application status (Aceptado / Rechazado)
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden actualizar postulaciones" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["Aceptado", "Rechazado"].includes(status)) {
      return res.status(400).json({ error: "status debe ser 'Aceptado' o 'Rechazado'" });
    }

    const { data: application, error: fetchError } = await supabase
      .from("job_offer_application")
      .select("id, job_offer_id")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id")
      .eq("id", application.job_offer_id)
      .eq("employer_user_id", req.user.id)
      .single();

    if (jobError || !job) {
      return res.status(403).json({ error: "No tienes permiso para modificar esta postulación" });
    }

    const { error: updateError } = await supabase
      .from("job_offer_application")
      .update({ status })
      .eq("id", id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.json({ message: "Estado actualizado" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
