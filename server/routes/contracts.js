const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");
const notify = require("../utils/notify"); 

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PRIVATE_BUCKET = "contracts";

const PENDING_SIGNATURE_STATUSES = ["sent", "pending", "pendiente", "Pendiente"];
const ACTIVE_CONTRACT_STATUS = "accepted";
const FINALIZED_CONTRACT_STATUS = "finalized";

function isPendingSignatureStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return ["sent", "pending", "pendiente"].includes(normalized);
}

function mapUserRoleToInitiatedBy(role) {
  if (role === "employer") return "EMPLOYER";
  if (role === "employee") return "EMPLOYEE";
  return null;
}

function getAllowedTerminationTypes(initiatedBy) {
  switch (initiatedBy) {
    case "EMPLOYER":
      return ["DESPIDO"];
    case "EMPLOYEE":
      return ["RENUNCIA"];
    case "SYSTEM":
      return ["VENCIMIENTO"];
    default:
      return [];
  }
}

async function getTerminationForContract(contractId) {
  const { data, error } = await supabase
    .from("contract_termination")
    .select("id, contract_id, type, reason, initiated_by, terminated_at, created_at")
    .eq("contract_id", contractId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return { error };
  return { termination: data?.[0] || null };
}

async function getTerminationResponses(terminationId) {
  const { data, error } = await supabase
    .from("contract_termination_response")
    .select(
      "id, termination_id, user_id, role, response, comment, responded_at"
    )
    .eq("termination_id", terminationId)
    .order("responded_at", { ascending: true });

  if (error) return { error };

  const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
  let userMap = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("app_user")
      .select("id, full_name, email")
      .in("id", userIds);
    for (const u of users || []) {
      userMap[u.id] = u;
    }
  }

  const responses = (data || []).map((r) => ({
    ...r,
    user: userMap[r.user_id] || null,
  }));

  return { responses };
}

function getLocalDateString(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function parseBase64File(fileBase64) {
  if (!fileBase64) return null;
  const cleaned = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
  return Buffer.from(cleaned, "base64");
}

async function getUserProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from("app_user")
    .select("id, full_name, email")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data;
}

async function enrichContract(contract) {
  if (!contract) return null;
  const [employerUser, employeeUser] = await Promise.all([
    getUserProfile(contract.employer_user_id),
    getUserProfile(contract.employee_user_id),
  ]);
  return {
    ...contract,
    employer: { user: employerUser },
    employee: { user: employeeUser },
  };
}

async function enrichContracts(contracts = []) {
  return Promise.all(contracts.map((contract) => enrichContract(contract)));
}

// ============================================
// GET /api/contracts
// ============================================
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const field = role === "employer" ? "employer_user_id" : "employee_user_id";

    const { data: contractsData, error: contractsError } = await supabase
      .from("contract")
      .select(`
        *,
        contract_schedule (id, week_day, start_time, end_time),
        employee_user:employee_user_id (id, full_name),
        employer_user:employer_user_id (id, full_name)
      `)
      .eq(field, userId);

    if (contractsError) {
      return res.status(500).json({ error: contractsError.message });
    }
    return res.json(contractsData);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// POST /api/contracts/from-application/:applicationId
// Empleador crea contrato y lo envía al empleado
// ============================================
router.post("/from-application/:applicationId", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden adjuntar contratos" });
    }

    const { applicationId } = req.params;
    const { fileName, fileType, fileBase64, start_date, end_date } = req.body;

    if (!fileName || !fileType || !fileBase64) {
      return res.status(400).json({ error: "Archivo requerido" });
    }
    if (fileType !== "application/pdf") {
      return res.status(400).json({ error: "Solo se permiten archivos PDF" });
    }

    const fileBuffer = parseBase64File(fileBase64);
    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: "Archivo inválido" });
    }
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return res.status(400).json({ error: "El archivo no puede superar los 10 MB" });
    }

    const { data: application, error: fetchError } = await supabase
      .from("job_offer_application")
      .select("id, status, job_offer_id, employee_user_id")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return res.status(404).json({ error: "Aplicación no encontrada" });
    }

    const { data: jobOffer, error: jobOfferError } = await supabase
      .from("job_offer")
      .select("id, title, salary, employer_user_id, schedule_id")
      .eq("id", application.job_offer_id)
      .single();

    if (jobOfferError || !jobOffer) {
      return res.status(404).json({ error: "Oferta no encontrada" });
    }
    if (jobOffer.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { data: scheduleDetails, error: scheduleError } = await supabase
      .from("schedule_details")
      .select("id, week_day, start_time, end_time")
      .eq("schedule_id", jobOffer.schedule_id);

    if (scheduleError) {
      return res.status(500).json({ error: "Error al obtener horarios: " + scheduleError.message });
    }
    if (!scheduleDetails || scheduleDetails.length === 0) {
      return res.status(400).json({ error: "La oferta no tiene horarios definidos" });
    }
    for (const detail of scheduleDetails) {
      const validDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      if (!validDays.includes(detail.week_day)) {
        return res.status(400).json({ error: `Día inválido en horarios: ${detail.week_day}` });
      }
      if (!detail.start_time || !detail.end_time) {
        return res.status(400).json({ error: "Horarios incompletos en la oferta" });
      }
      if (detail.start_time >= detail.end_time) {
        return res.status(400).json({ error: `Horario inválido para ${detail.week_day}: inicio debe ser antes del fin` });
      }
    }

    const normalizedStatus = String(application.status || "").toLowerCase();
    if (normalizedStatus === "rechazado" || normalizedStatus === "rejected") {
      return res.status(400).json({ error: "No se puede generar un contrato para una aplicación rechazada" });
    }
    if (normalizedStatus !== "aceptado" && normalizedStatus !== "accepted") {
      return res.status(400).json({ error: "La aplicación debe estar aceptada antes de adjuntar el contrato" });
    }

    const contractDate = start_date || getLocalDateString();
    const contractEndDate = end_date || null;
    const today = getLocalDateString();
    if (contractDate < today) {
      return res.status(400).json({ error: "La fecha de inicio no puede ser anterior a hoy" });
    }
    if (contractEndDate && contractEndDate <= contractDate) {
      return res.status(400).json({ error: "La fecha de fin debe ser posterior a la fecha de inicio" });
    }

    const { data: draftContract, error: insertError } = await supabase
      .from("contract")
      .insert({
        title: jobOffer.title,
        salary: jobOffer.salary,
        start_date: contractDate,
        end_date: contractEndDate,
        status: "draft",
        employer_user_id: req.user.id,
        employee_user_id: application.employee_user_id,
      })
      .select()
      .single();

    if (insertError || !draftContract) {
      return res.status(500).json({ error: insertError?.message || "No se pudo crear el contrato" });
    }

    const storagePath = `contracts/${draftContract.id}/employer.pdf`;
    const cleanUploadPath = storagePath.startsWith(PRIVATE_BUCKET + "/")
      ? storagePath.slice(PRIVATE_BUCKET.length + 1)
      : storagePath;

    const { error: uploadError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .upload(cleanUploadPath, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      await supabase.from("contract").delete().eq("id", draftContract.id);
      return res.status(500).json({ error: uploadError.message });
    }

    const contractScheduleRecords = scheduleDetails.map((detail) => ({
      contract_id: draftContract.id,
      week_day: detail.week_day,
      start_time: detail.start_time,
      end_time: detail.end_time,
    }));

    const { error: scheduleInsertError } = await supabase
      .from("contract_schedule")
      .insert(contractScheduleRecords);

    if (scheduleInsertError) {
      await supabase.from("contract").delete().eq("id", draftContract.id);
      return res.status(500).json({ error: "Error al guardar horarios del contrato: " + scheduleInsertError.message });
    }

    const sentAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: updatedContract, error: updateError } = await supabase
      .from("contract")
      .update({
        employer_contract_url: cleanUploadPath,
        status: "sent",
        sent_at: sentAt,
        expires_at: expiresAt,
      })
      .eq("id", draftContract.id)
      .select()
      .single();

    if (updateError || !updatedContract) {
      await supabase.from("contract_schedule").delete().eq("contract_id", draftContract.id);
      return res.status(500).json({ error: updateError?.message || "No se pudo actualizar el contrato" });
    }

    // ── NOTIFY: avisar al empleado que tiene un contrato nuevo para firmar ──
      await notify({
      userId: application.employee_user_id,
      type: "contract_created",
      referenceId: updatedContract.id,
      data: { title: jobOffer.title },
    });
    const contract = await enrichContract(updatedContract);
    return res.json({ message: "Contrato adjuntado correctamente", contract });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/contracts/my
// ============================================
router.get("/my", auth, async (req, res) => {
  try {
    const isEmployer = req.user.role === "employer";

    let query = supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, accepted_at, rejected_at, expires_at, created_at,
        employer_contract_url, employer_user_id, employee_user_id,
        schedule:contract_schedule(id, week_day, start_time, end_time)
      `)
      .order("created_at", { ascending: false });

    if (isEmployer) {
      query = query.eq("employer_user_id", req.user.id);
    } else {
      query = query.eq("employee_user_id", req.user.id);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const contracts = await enrichContracts(data || []);
    const contractIds = contracts.map((c) => c.id);
    let pendingIds = new Set();

    if (contractIds.length > 0) {
      const { data: terminations } = await supabase
        .from("contract_termination")
        .select("contract_id")
        .in("contract_id", contractIds);
      for (const t of terminations || []) pendingIds.add(t.contract_id);
    }

    const enriched = contracts.map((c) => ({
      ...c,
      has_pending_termination: c.status === "accepted" && pendingIds.has(c.id),
    }));

    return res.json({ contracts: enriched });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/contracts/pending-sign
// ============================================
router.get("/pending-sign", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo trabajadores pueden ver contratos pendientes de firma" });
    }

    const { data: contracts, error } = await supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, expires_at, created_at, employer_contract_url,
        employer_user_id, employee_user_id,
        schedule:contract_schedule(id, week_day, start_time, end_time)
      `)
      .eq("employee_user_id", req.user.id)
      .in("status", PENDING_SIGNATURE_STATUSES)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const enrichedContracts = await Promise.all((contracts || []).map(enrichContract));
    return res.json({ pendingContracts: enrichedContracts });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/contracts/pending-upload
// ============================================
router.get("/pending-upload", auth, async (req, res) => {
  try {
    if (req.user.role !== "employer") {
      return res.status(403).json({ error: "Solo empleadores pueden ver pendientes" });
    }

    const { data: jobOffers, error: jobsError } = await supabase
      .from("job_offer")
      .select("id")
      .eq("employer_user_id", req.user.id);

    if (jobsError) return res.status(500).json({ error: jobsError.message });

    const jobOfferIds = (jobOffers || []).map((job) => job.id).filter(Boolean);
    if (jobOfferIds.length === 0) return res.json({ pendingApplications: [] });

    const { data: acceptedApplications, error: applicationsError } = await supabase
      .from("job_offer_application")
      .select(`
        id, status, created_at, job_offer_id, employee_user_id,
        job_offer:job_offer(id, title, salary, address:address(country, state, city, address_line_1)),
        employee:employee_user(user:app_user(id, full_name, email))
      `)
      .in("job_offer_id", jobOfferIds)
      .eq("status", "Aceptado")
      .order("created_at", { ascending: false });

    if (applicationsError) return res.status(500).json({ error: applicationsError.message });

    const { data: existingContracts, error: contractsError } = await supabase
      .from("contract")
      .select("id, title, employee_user_id")
      .eq("employer_user_id", req.user.id);

    if (contractsError) return res.status(500).json({ error: contractsError.message });

    const existingContractKeys = new Set(
      (existingContracts || []).map((c) => `${c.employee_user_id || ""}::${c.title || ""}`)
    );

    const pendingApplications = (acceptedApplications || []).filter((app) => {
      const key = `${app.employee_user_id || ""}::${app.job_offer?.title || ""}`;
      return !existingContractKeys.has(key);
    });

    return res.json({ pendingApplications });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/contracts/:id/download/:role
// ============================================
router.get("/:id/download/:role", auth, async (req, res) => {
  try {
    const { id, role } = req.params;
    if (!["employer", "employee"].includes(role)) {
      return res.status(400).json({ error: "Rol inválido para descarga" });
    }

    const { data: contract, error: fetchError } = await supabase
      .from("contract")
      .select("id, employer_contract_url, employer_user_id, employee_user_id")
      .eq("id", id)
      .single();

    if (fetchError || !contract) return res.status(404).json({ error: "Contrato no encontrado" });

    if (req.user.id !== contract.employer_user_id && req.user.id !== contract.employee_user_id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const storagePath = role === "employer"
      ? contract.employer_contract_url
      : `contracts/${id}/employee.pdf`;

    if (!storagePath) {
      return res.status(404).json({ error: "No hay archivo disponible para descargar" });
    }

<<<<<<< HEAD
=======
    // Use the path exactly as stored in DB
    const cleanPath = storagePath;
>>>>>>> origin/develop
    const { data, error: urlError } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (urlError || !data?.signedUrl) {
      return res.status(500).json({ error: urlError?.message || "No se pudo generar el enlace de descarga" });
    }

    return res.json({ downloadUrl: data.signedUrl });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// PUT /api/contracts/:id/activate
// Empleador activa el contrato tras firma del empleado
// ============================================
router.put("/:id/activate", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: contract, error: fetchError } = await supabase
      .from("contract")
      .select("id, status, employer_user_id, employee_user_id, employer_contract_url")
      .eq("id", id)
      .single();

    if (fetchError || !contract) return res.status(404).json({ error: "Contrato no encontrado" });

    if (contract.employer_user_id !== req.user.id) {
      return res.status(403).json({ error: "Solo el empleador puede activar el contrato" });
    }
    if (contract.status !== "worker_signed") {
      return res.status(400).json({ error: "El trabajador aún no ha subido su copia firmada" });
    }

    const acceptedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("contract")
      .update({ status: "accepted", accepted_at: acceptedAt })
      .eq("id", id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // ── NOTIFY: avisar al empleado que el contrato está activo ──
      await notify({
      userId: contract.employee_user_id,
      type: "contract_accepted",
      referenceId: id,
      data: {},
    });

    const { data: updatedContract, error: reloadError } = await supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, accepted_at, rejected_at, expires_at, created_at,
        employer_contract_url, employer_user_id, employee_user_id
      `)
      .eq("id", id)
      .single();

    if (reloadError || !updatedContract) {
      return res.json({ message: "Contrato activado exitosamente" });
    }

    const enrichedContract = await enrichContract(updatedContract);
    return res.json({ message: "Contrato activado exitosamente", contract: enrichedContract });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// GET /api/contracts/:id
// ============================================
router.get("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, accepted_at, rejected_at, expires_at, created_at,
        employer_contract_url, employer_user_id, employee_user_id,
        schedule:contract_schedule(id, week_day, start_time, end_time)
      `)
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Contrato no encontrado" });

    if (req.user.id !== data.employer_user_id && req.user.id !== data.employee_user_id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const contract = await enrichContract(data);

    let reference = null;
    if (req.user.role === "employer") {
      const { data: ref } = await supabase
        .from("employer_references")
        .select("receiver_app_user_id, author_app_user_id, treatment, payment_responsibility, review, visible")
        .eq("receiver_app_user_id", contract.employee_user_id)
        .eq("author_app_user_id", req.user.id)
        .maybeSingle();
      reference = ref || null;
    } else if (req.user.role === "employee") {
      const { data: ref } = await supabase
        .from("employee_references")
        .select("receiver_app_user_id, author_app_user_id, performance, punctuality, review, visible")
        .eq("receiver_app_user_id", contract.employer_user_id)
        .eq("author_app_user_id", req.user.id)
        .maybeSingle();
      reference = ref || null;
    }

    const { termination, error: terminationError } = await getTerminationForContract(id);
    if (terminationError) return res.status(500).json({ error: terminationError.message });

    let terminationResponses = [];
    if (termination?.id) {
      const { responses, error: responsesError } = await getTerminationResponses(termination.id);
      if (responsesError) return res.status(500).json({ error: responsesError.message });
      terminationResponses = responses;
    }

    return res.json({ contract, termination, terminationResponses, reference });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// POST /api/contracts/:id/terminate
// Finalizar contrato (despido o renuncia)
// ============================================
router.post("/:id/terminate", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, reason } = req.body || {};

    const initiatedBy = mapUserRoleToInitiatedBy(req.user.role);
    if (!initiatedBy) return res.status(403).json({ error: "No autorizado para finalizar contratos" });

    const normalizedReason = String(reason || "").trim();
    if (!type || !normalizedReason) {
      return res.status(400).json({ error: "Tipo y motivo son obligatorios" });
    }

    const allowedTypes = getAllowedTerminationTypes(initiatedBy);
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Tipo de finalizacion no permitido" });
    }

    const { data: contract, error: fetchError } = await supabase
      .from("contract")
      .select("id, status, employer_user_id, employee_user_id, title")
      .eq("id", id)
      .single();

    if (fetchError || !contract) return res.status(404).json({ error: "Contrato no encontrado" });

    if (req.user.id !== contract.employer_user_id && req.user.id !== contract.employee_user_id) {
      return res.status(403).json({ error: "No autorizado" });
    }
    if (contract.status !== ACTIVE_CONTRACT_STATUS) {
      return res.status(400).json({ error: "El contrato no esta activo" });
    }

    const { data: existingTerminations, error: terminationLookupError } = await supabase
      .from("contract_termination")
      .select("id")
      .eq("contract_id", id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (terminationLookupError) return res.status(500).json({ error: terminationLookupError.message });
    if (existingTerminations?.length) return res.status(409).json({ error: "El contrato ya fue finalizado" });

    const { data: termination, error: terminationError } = await supabase
      .from("contract_termination")
      .insert({ contract_id: id, type, reason: normalizedReason, initiated_by: initiatedBy })
      .select()
      .single();

    if (terminationError || !termination) {
      return res.status(500).json({ error: terminationError?.message || "No se pudo finalizar" });
    }

    const { error: updateError } = await supabase
      .from("contract")
      .update({ status: ACTIVE_CONTRACT_STATUS })
      .eq("id", id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // ── NOTIFY: avisar a la otra parte sobre la finalización ──
    // Si lo inicia el empleador → avisar al empleado
    // Si lo inicia el empleado  → avisar al empleador
    const isEmployer = req.user.role === "employer";
    const notifyUserId = isEmployer ? contract.employee_user_id : contract.employer_user_id;
    const terminationLabel = type === "DESPIDO" ? "despedida" : "renunciaste a";

    if (isEmployer) {
  await notify({
    userId: contract.employee_user_id,
    type: "contract_finished_employer",
    referenceId: id,
    data: { title: contract.title, reason: normalizedReason },
  });
} else {
  await notify({
    userId: contract.employer_user_id,
    type: "contract_finished_employee",
    referenceId: id,
    data: { title: contract.title, reason: normalizedReason },
  });
}

    const { data: updatedContract, error: reloadError } = await supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, accepted_at, rejected_at, expires_at, created_at,
        employer_contract_url, employer_user_id, employee_user_id
      `)
      .eq("id", id)
      .single();

    if (reloadError || !updatedContract) {
      return res.json({ message: "Contrato finalizado", termination });
    }

    const enrichedContract = await enrichContract(updatedContract);
    return res.json({
      message: "Contrato finalizado",
      contract: enrichedContract,
      termination,
      terminationResponses: [],
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// PUT /api/contracts/:id/sign
// Empleado sube su PDF firmado
// ============================================
router.put("/:id/sign", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileBase64, fileName } = req.body;

    const { data: contract, error: fetchError } = await supabase
      .from("contract")
      .select("id, status, employee_user_id, employer_user_id, title")
      .eq("id", id)
      .single();

    if (fetchError || !contract) return res.status(404).json({ error: "Contrato no encontrado" });

    if (contract.employee_user_id !== req.user.id) {
      return res.status(403).json({ error: "Solo el trabajador puede firmar el contrato" });
    }
    if (contract.status === "worker_signed" || contract.status === "accepted") {
      return res.status(400).json({ error: "El contrato ya fue firmado previamente" });
    }
    if (!isPendingSignatureStatus(contract.status)) {
      return res.status(400).json({ error: "El contrato no está pendiente de firma" });
    }

    let updateData = { status: "worker_signed" };

    if (fileBase64 && fileName) {
      const fileBuffer = parseBase64File(fileBase64);
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ error: "Archivo inválido" });
      }
      if (fileBuffer.length > MAX_FILE_SIZE) {
        return res.status(400).json({ error: "El archivo no puede superar los 10 MB" });
      }

      const employeeStoragePath = `contracts/${id}/employee.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(PRIVATE_BUCKET)
        .upload(employeeStoragePath, fileBuffer, { contentType: "application/pdf", upsert: true });

      if (uploadError) {
        return res.status(500).json({ error: `Error al subir archivo: ${uploadError.message}` });
      }
    }

    const { error: updateError } = await supabase
      .from("contract")
      .update(updateData)
      .eq("id", id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // ── NOTIFY: avisar al empleador que el empleado firmó y está esperando activación ──
    await notify({
      userId: contract.employer_user_id,
      type: "contract_signed",
      referenceId: id,
      data: { title: contract.title },
    });

    const { data: updatedContract, error: reloadError } = await supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, accepted_at, rejected_at, expires_at, created_at,
        employer_contract_url, employer_user_id, employee_user_id
      `)
      .eq("id", id)
      .single();

    if (reloadError || !updatedContract) {
      return res.json({ message: "Contrato firmado exitosamente" });
    }

    const enrichedContract = await enrichContract(updatedContract);
    return res.json({ message: "Contrato firmado exitosamente", contract: enrichedContract });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// PUT /api/contracts/:id/reject
// Empleado rechaza el contrato
// ============================================
router.put("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ error: "Solo trabajadores pueden rechazar contratos" });
    }

    const { id } = req.params;

    const { data: contract, error: fetchError } = await supabase
      .from("contract")
      .select("id, status, employee_user_id, employer_user_id, title")
      .eq("id", id)
      .single();

    if (fetchError || !contract) return res.status(404).json({ error: "Contrato no encontrado" });

    if (contract.employee_user_id !== req.user.id) {
      return res.status(403).json({ error: "Solo el trabajador puede rechazar el contrato" });
    }
    if (!isPendingSignatureStatus(contract.status)) {
      return res.status(400).json({ error: "El contrato no está pendiente de firma" });
    }

    const rejectedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("contract")
      .update({ status: "rejected", rejected_at: rejectedAt })
      .eq("id", id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    // ── NOTIFY: avisar al empleador que el empleado rechazó ──
    await notify({
  userId: contract.employer_user_id,
  type: "contract_rejected",
  referenceId: id,
  data: { title: contract.title },
});

    const { data: updatedContract, error: reloadError } = await supabase
      .from("contract")
      .select(`
        id, title, salary, start_date, end_date, status,
        sent_at, accepted_at, rejected_at, expires_at, created_at,
        employer_contract_url, employer_user_id, employee_user_id
      `)
      .eq("id", id)
      .single();

    if (reloadError || !updatedContract) {
      return res.json({ message: "Contrato rechazado exitosamente" });
    }

    const enrichedContract = await enrichContract(updatedContract);
    return res.json({ message: "Contrato rechazado exitosamente", contract: enrichedContract });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;