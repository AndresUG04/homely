const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");
const notify = require("../utils/notify"); 

// POST /api/job-applications
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo trabajadores pueden postularse" });
    }

    const { job_offer_id } = req.body;

    if (!job_offer_id) {
      return res.status(400).json({ error: "job_offer_id es requerido" });
    }

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id, status, employer_user_id, title")
      .eq("id", job_offer_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ error: "Esta oferta ya no está disponible" });
    }

    if (job.employer_user_id === req.user.id) {
      return res.status(400).json({ error: "No puedes postularte a tu propia oferta" });
    }

    const { data: existing, error: dupError } = await supabase
      .from("job_offer_application")
      .select("id")
      .eq("job_offer_id", job_offer_id)
      .eq("employee_user_id", req.user.id)
      .maybeSingle();

    if (dupError) return res.status(500).json({ error: dupError.message });

    if (existing) {
      return res.status(400).json({ error: "Ya te postulaste a esta oferta" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .insert({
        job_offer_id,
        employee_user_id: req.user.id,
        status: "Pendiente",
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // ── NOTIFY: avisar al empleador que recibió una nueva postulación ──
    await notify({
      userId: job.employer_user_id,
      title: "Nueva postulación recibida 💼",
      message: `Alguien se postuló a tu oferta "${job.title}".`,
      type: "application_received",
      referenceId: null,
    });
console.log("[NOTIFY] Enviada a:", job.employer_user_id);
    return res.status(201).json({ application: data });
  } catch (err) {
    console.error("[APPLY]", err);
    return res.status(500).json({ error: "Error al postularse" });
  }
});

// GET /api/job-applications/my
router.get("/my", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo trabajadores pueden ver sus postulaciones" });
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
          salary,
          status,
          address:address(country, state, city),
          schedule:schedule(schedule_type)
        )
      `)
      .eq("employee_user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ applications: data || [] });
  } catch (err) {
    console.error("[MY APPLICATIONS]", err);
    return res.status(500).json({ error: "Error al obtener postulaciones" });
  }
});

// GET /api/job-applications/job/:jobId
router.get("/job/:jobId", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden ver postulaciones" });
    }

    const { jobId } = req.params;

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id, title, employer_user_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }

    if (job.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Esta oferta no te pertenece" });
    }

    const { data, error } = await supabase
      .from("job_offer_application")
      .select(`
        id,
        status,
        created_at,
        job_offer:job_offer(id, title),
        employee:employee_user(
          user:app_user(
            id,
            full_name,
            email,
            phone,
            subscriptions:user_suscription(
              status,
              plan:suscription_plan(name)
            )
          )
        )
      `)
      .eq("job_offer_id", jobId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    if (data) {
      data.sort((a, b) => {
        const aSubs = a.employee?.user?.subscriptions || [];
        const bSubs = b.employee?.user?.subscriptions || [];
        const aPro = aSubs.some(s => s.status === "Activa" && s.plan?.name === "Pro Trabajador");
        const bPro = bSubs.some(s => s.status === "Activa" && s.plan?.name === "Pro Trabajador");
        if (aPro && !bPro) return -1;
        if (!aPro && bPro) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    return res.json({ applications: data || [] });
  } catch (err) {
    console.error("[JOB APPLICATIONS]", err);
    return res.status(500).json({ error: "Error al obtener postulaciones" });
  }
});

// GET /api/job-applications/:id
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
        job_offer:job_offer(
          id,
          title,
          salary,
          status,
          address:address(country, state, city)
        ),
        employee:employee_user(
          user:app_user(id, full_name, email, phone)
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    return res.json({ application: data });
  } catch (err) {
    console.error("[GET APPLICATION]", err);
    return res.status(500).json({ error: "Error al obtener postulación" });
  }
});

// PUT /api/job-applications/:id
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden actualizar postulaciones" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["Aceptado", "Rechazado"].includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    // Traer también employee_user_id y título de la oferta para el notify
    const { data: application, error: fetchError } = await supabase
      .from("job_offer_application")
      .select("id, status, job_offer_id, employee_user_id")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: "Postulación no encontrada" });
    }

    if (application.status !== "Pendiente") {
      return res.status(400).json({ error: "Esta postulación ya fue procesada" });
    }

    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id, title, employer_user_id")
      .eq("id", application.job_offer_id)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }

    if (job.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Esta oferta no te pertenece" });
    }

    const { error: updateError } = await supabase
      .from("job_offer_application")
      .update({ status })
      .eq("id", id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // ── NOTIFY: avisar al empleado según la decisión ──
    if (status === "Aceptado") {
      await notify({
        userId: application.employee_user_id,
        title: "Postulación aceptada ✨",
        message: `Tu postulación a "${job.title}" fue aceptada. Pronto recibirás el contrato.`,
        type: "application_accepted",
        referenceId: null,
      });
      console.log("[NOTIFY] Enviada a:", job.employer_user_id);

    } else {
      await notify({
        userId: application.employee_user_id,
        title: "Postulación no seleccionada",
        message: `Tu postulación a "${job.title}" no fue seleccionada esta vez.`,
        type: "application_rejected",
        referenceId: null,
      });
      console.log("[NOTIFY] Enviada a:", job.employer_user_id);

    }

    return res.json({ message: "Postulación actualizada" });
  } catch (err) {
    console.error("[UPDATE APPLICATION]", err);
    return res.status(500).json({ error: "Error al actualizar postulación" });
  }
});

module.exports = router;