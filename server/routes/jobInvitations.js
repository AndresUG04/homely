const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// ============================================
// POST /api/job-invitations
// Empleador envía invitación a un trabajador
// ============================================
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden enviar invitaciones" });
    }

    const { job_offer_id, employee_user_id } = req.body;

    if (!job_offer_id || !employee_user_id) {
      return res.status(400).json({ error: "job_offer_id y employee_user_id son requeridos" });
    }

    // Validar que la oferta pertenece al empleador y está abierta
    const { data: job, error: jobError } = await supabase
      .from("job_offer")
      .select("id, status")
      .eq("id", job_offer_id)
      .eq("employer_user_id", req.user.id)
      .single();

    if (jobError || !job) {
      return res.status(403).json({ error: "La oferta no existe o no te pertenece" });
    }

    if (job.status !== "open") {
      return res.status(400).json({ error: "Solo puedes invitar desde ofertas abiertas" });
    }

    // Validar que el destinatario es un employee
    const { data: worker, error: workerError } = await supabase
      .from("app_user")
      .select("id, role")
      .eq("id", employee_user_id)
      .eq("role", "employee")
      .single();

    if (workerError || !worker) {
      return res.status(404).json({ error: "Trabajador no encontrado" });
    }

    // Insertar (el UNIQUE constraint evita duplicados)
    const { data, error } = await supabase
      .from("job_offer_invitation")
      .insert({ job_offer_id, employee_user_id, status: "pending" })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ error: "Ya enviaste esta oferta a este trabajador" });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ invitation: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/job-invitations/received
// Trabajador ve sus invitaciones recibidas
// ============================================
router.get("/received", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados pueden ver sus invitaciones" });
    }

    const { data, error } = await supabase
      .from("job_offer_invitation")
      .select(`
        id,
        status,
        created_at,
        job_offer:job_offer(
          id,
          title,
          description,
          salary,
          status,
          address:address(country, state, city),
          employer:employer_user(
            user:app_user(full_name)
          ),
          schedule:schedule(schedule_type)
        )
      `)
      .eq("employee_user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Pendientes primero
    const sorted = [
      ...(data || []).filter((i) => i.status === "pending"),
      ...(data || []).filter((i) => i.status !== "pending"),
    ];

    return res.json({ invitations: sorted });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/job-invitations/sent
// Empleador ve el historial de invitaciones enviadas
// (dos pasos: primero IDs de sus ofertas, luego filtrar invitaciones)
// ============================================
router.get("/sent", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores" });
    }

    // Paso 1: obtener IDs de las ofertas del empleador
    const { data: employerOffers, error: offersError } = await supabase
      .from("job_offer")
      .select("id, title")
      .eq("employer_user_id", req.user.id);

    if (offersError) return res.status(500).json({ error: offersError.message });

    const offerIds = (employerOffers || []).map((o) => o.id);
    if (offerIds.length === 0) return res.json({ invitations: [] });

    // Paso 2: obtener invitaciones para esas ofertas
    const { data, error } = await supabase
      .from("job_offer_invitation")
      .select("id, status, created_at, job_offer_id, employee_user_id")
      .in("job_offer_id", offerIds)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    // Enriquecer con nombre de oferta
    const offerMap = Object.fromEntries((employerOffers || []).map((o) => [o.id, o.title]));
    const enriched = (data || []).map((inv) => ({
      ...inv,
      offer_title: offerMap[inv.job_offer_id] || "-",
    }));

    return res.json({ invitations: enriched });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// PUT /api/job-invitations/:id
// Trabajador acepta o rechaza una invitación
// ============================================
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo empleados pueden responder invitaciones" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status debe ser 'accepted' o 'rejected'" });
    }

    // Validar que la invitación pertenece al trabajador y está pendiente
    const { data: invitation, error: fetchError } = await supabase
      .from("job_offer_invitation")
      .select("id, status, job_offer_id, employee_user_id")
      .eq("id", id)
      .eq("employee_user_id", req.user.id)
      .single();

    if (fetchError || !invitation) {
      return res.status(404).json({ error: "Invitación no encontrada" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ error: "Esta invitación ya fue respondida" });
    }

    if (status === "accepted") {
      // Crear job_offer_application con status "Aceptado"
      const { error: appError } = await supabase
        .from("job_offer_application")
        .insert({
          job_offer_id: invitation.job_offer_id,
          employee_user_id: req.user.id,
          status: "Aceptado",
        });

      if (appError) {
        // Si ya existe una aplicación (constraint UNIQUE), continuar igual
        if (appError.code !== "23505") {
          return res.status(500).json({ error: appError.message });
        }
      }
    }

    // Actualizar estado de la invitación
    const { error: updateError } = await supabase
      .from("job_offer_invitation")
      .update({ status })
      .eq("id", id)
      .eq("employee_user_id", req.user.id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.json({ message: status === "accepted" ? "Oferta aceptada" : "Oferta rechazada" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
