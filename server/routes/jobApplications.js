const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");


// ============================================
// POST /api/job-applications
// Crear aplicación (employee aplica a oferta)
// ============================================
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados pueden aplicar" });
    }

    const { job_offer_id } = req.body;

    if (!job_offer_id) {
      return res.status(400).json({ error: "job_offer_id requerido" });
    }

    const { error } = await supabase
      .from("job_offer_application")
      .insert({
        employee_user_id: req.user.id,
        job_offer_id,
        status: "Pendiente"
      });

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Ya aplicaste a esta oferta" });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: "Aplicación enviada" });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});


// ============================================
// GET /api/job-applications/my
// Aplicaciones del employee loggeado
// ============================================
router.get("/my", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .select(`
        *,
        job_offer:job_offer(
          id,
          title,
          description,
          salary,
          status
        )
      `)
      .eq("employee_user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ applications: data });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});


// ============================================
// GET /api/job-applications/job/:jobId
// Ver aplicantes de UNA oferta (employer)
// ============================================
router.get("/job/:jobId", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores" });
    }

    const { jobId } = req.params;

    // 🔒 Validar que la oferta le pertenece
    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id")
      .eq("id", jobId)
      .eq("employer_user_id", req.user.id)
      .single();

    if (jobError || !job) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .select(`
        *,
        employee:employee_user(
          user:app_user(
            id,
            full_name,
            email,
            phone
          )
        )
      `)
      .eq("job_offer_id", jobId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ applications: data });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});


// ============================================
// PUT /api/job-applications/:id
// Cambiar estado (employer)
// ============================================
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status requerido" });
    }

    // 🔒 Validar que la aplicación pertenece a una oferta del employer
    const { data: app, error: fetchError } = await supabase
      .from("job_offer_application")
      .select(`
        id,
        job_offer:job_offer(employer_user_id)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !app) {
      return res.status(404).json({ error: "Aplicación no encontrada" });
    }

    if (app.job_offer.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { error } = await supabase
      .from("job_offer_application")
      .update({ status })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ message: "Estado actualizado" });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});


// ============================================
// DELETE /api/job-applications/:id
// Eliminar aplicación (employee)
// ============================================
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados" });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from("job_offer_application")
      .delete()
      .eq("id", id)
      .eq("employee_user_id", req.user.id);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ message: "Aplicación eliminada" });

  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;