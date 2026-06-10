const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");
const notify = require("../utils/notify");

router.get("/:contractId/:year/:month", auth, async (req, res) => {
  const { contractId, year, month } = req.params;
  const userId = req.user.id;

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .gte("work_date", start)
      .lte("work_date", end);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/employer/:contractId/:year/:month", auth, async (req, res) => {
  const { contractId, year, month } = req.params;
  const userId = req.user.id;

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id")
      .eq("id", contractId)
      .eq("employer_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(Number(year), Number(month), 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .gte("work_date", start)
      .lte("work_date", end);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/check-in", auth, async (req, res) => {
  const { contractId, localDateStr, localTimeStr } = req.body;
  const userId = req.user.id;

  if (!localDateStr || !localTimeStr)
    return res.status(400).json({ error: "localDateStr and localTimeStr are required" });

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("*, contract_schedule(*)")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const localDate = new Date(localDateStr + "T12:00:00");
    const todayName = days[localDate.getDay()];
    const schedule = contract.contract_schedule.find(s => s.week_day === todayName);

    if (!schedule)
      return res.status(400).json({ error: "Today is not a work day for this contract" });

    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .eq("work_date", localDateStr)
      .maybeSingle();

    if (existing?.check_in)
      return res.status(400).json({ error: "Already checked in today" });

    const [clientH, clientM] = localTimeStr.split(":").map(Number);
    const [schedH, schedM]   = schedule.start_time.split(":").map(Number);
    const clientMinutes       = clientH * 60 + clientM;
    const limitMinutes        = schedH * 60 + schedM + 10;

    const status = clientMinutes <= limitMinutes ? "Puntual" : "Tardía";
    const checkIn = `${localDateStr}T${localTimeStr}:00`;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("attendance")
        .update({ check_in: checkIn, status })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      result = data;
    } else {
      const { data, error } = await supabase
        .from("attendance")
        .insert({ contract_id: contractId, work_date: localDateStr, check_in: checkIn, status })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      result = data;
    }

    return res.json({ attendance: result });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/check-out", auth, async (req, res) => {
  const { contractId, localDateStr, localTimeStr } = req.body;
  const userId = req.user.id;

  if (!localDateStr || !localTimeStr)
    return res.status(400).json({ error: "localDateStr and localTimeStr are required" });

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("*, contract_schedule(*)")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .eq("work_date", localDateStr)
      .maybeSingle();

    if (!existing?.check_in)
      return res.status(400).json({ error: "No check-in found for today" });

    if (existing?.check_out)
      return res.status(400).json({ error: "Already checked out today" });

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const localDate = new Date(localDateStr + "T12:00:00");
    const todayName = days[localDate.getDay()];
    const schedule = contract.contract_schedule.find(s => s.week_day === todayName);

    if (!schedule)
      return res.status(400).json({ error: "No schedule found for today" });

    const [outH, outM]     = localTimeStr.split(":").map(Number);
    const outMinutes        = outH * 60 + outM;
    const [endH, endM]     = schedule.end_time.split(":").map(Number);
    const endLimitMinutes   = endH * 60 + endM - 10;
    const checkInTimeStr    = existing.check_in.slice(11, 16);
    const [inH, inM]        = checkInTimeStr.split(":").map(Number);
    const inMinutes          = inH * 60 + inM;
    const [startH, startM] = schedule.start_time.split(":").map(Number);
    const startLimitMinutes = startH * 60 + startM + 10;

    const entradaTardia    = inMinutes > startLimitMinutes;
    const salidaAnticipada = outMinutes < endLimitMinutes;

    let status;
    if (entradaTardia && salidaAnticipada) status = "Marcas Irregulares";
    else if (salidaAnticipada)             status = "Salida Anticipada";
    else if (entradaTardia)                status = "Tardía";
    else                                   status = "Puntual";

    const checkOut = `${localDateStr}T${localTimeStr}:00`;

    const { data, error } = await supabase
      .from("attendance")
      .update({ check_out: checkOut, status })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/justify", auth, async (req, res) => {
  const { id } = req.params;
  const { justification } = req.body;
  const userId = req.user.id;

  try {
    if (!justification || !justification.trim())
      return res.status(400).json({ error: "Justification is required" });

    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*, contract(employee_user_id)")
      .eq("id", id)
      .single();

    if (attendanceError || !attendance)
      return res.status(404).json({ error: "Attendance record not found" });

    if (attendance.contract.employee_user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("attendance")
      .update({ justification, status: "Asistencia Justificada" })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    const { data: contractData } = await supabase
      .from("contract")
      .select("employer_user_id")
      .eq("id", attendance.contract_id)
      .single();

    await notify({
      userId: contractData.employer_user_id,
      title: "Nueva justificación recibida",
      message: `Tu trabajadora justificó su asistencia del ${attendance.work_date.slice(0, 10)}`,
      type: "attendance_justify",
      referenceId: id,
    });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/approve", auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*, contract(employer_user_id)")
      .eq("id", id)
      .single();

    if (attendanceError || !attendance)
      return res.status(404).json({ error: "Attendance record not found" });

    if (attendance.contract.employer_user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("attendance")
      .update({ approved: true, rejection_reason: null })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    const { data: contractData } = await supabase
      .from("contract")
      .select("employee_user_id")
      .eq("id", attendance.contract_id)
      .single();

    await notify({
      userId: contractData.employee_user_id,
      title: "Asistencia aprobada ✅",
      message: `Tu empleadora aprobó tu asistencia del ${attendance.work_date.slice(0, 10)}`,
      type: "attendance_approve",
      referenceId: id,
    });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/observe", auth, async (req, res) => {
  const { id } = req.params;
  const { observation } = req.body;
  const userId = req.user.id;

  try {
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*, contract(employer_user_id)")
      .eq("id", id)
      .single();

    if (attendanceError || !attendance)
      return res.status(404).json({ error: "Attendance record not found" });

    if (attendance.contract.employer_user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("attendance")
      .update({ observation })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    const { data: contractData } = await supabase
  .from("contract")
  .select("employee_user_id")
  .eq("id", attendance.contract_id)
  .single();

await notify({
  userId: contractData.employee_user_id,
  title: "Nueva observación 💬",
  message: `Tu empleadora dejó una observación en tu asistencia del ${attendance.work_date.slice(0, 10)}`,
  type: "attendance_observe",
  referenceId: id,
});
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/approve-range", auth, async (req, res) => {
  const { contractId, fromDate, toDate } = req.body;
  const userId = req.user.id;

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id")
      .eq("id", contractId)
      .eq("employer_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("attendance")
      .update({ approved: true, rejection_reason: null })
      .eq("contract_id", contractId)
      .gte("work_date", fromDate)
      .lte("work_date", toDate)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ updated: data.length, attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/reject", auth, async (req, res) => {
  const { id } = req.params;
  const { rejection_reason } = req.body;
  const userId = req.user.id;

  try {
    if (!rejection_reason || !rejection_reason.trim())
      return res.status(400).json({ error: "Rejection reason is required" });

    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*, contract(employer_user_id)")
      .eq("id", id)
      .single();

    if (attendanceError || !attendance)
      return res.status(404).json({ error: "Attendance record not found" });

    if (attendance.contract.employer_user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("attendance")
      .update({ approved: false, rejection_reason })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
        const { data: contractData } = await supabase
      .from("contract")
      .select("employee_user_id")
      .eq("id", attendance.contract_id)
      .single();

    await notify({
      userId: contractData.employee_user_id,
      title: "Asistencia rechazada ❌",
      message: `Tu empleadora rechazó tu asistencia del ${attendance.work_date.slice(0, 10)}: "${rejection_reason}"`,
      type: "attendance_reject",
      referenceId: id,
    });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});
router.post("/note", auth, async (req, res) => {
  const { contractId, date, note } = req.body;
  const userId = req.user.id;

  if (!contractId || !date || !note?.trim())
    return res.status(400).json({ error: "contractId, date and note are required" });

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .eq("work_date", date)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("attendance")
        .update({ note })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ attendance: data });
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert({ contract_id: contractId, work_date: date, note })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id/note", auth, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  const userId = req.user.id;

  if (!note?.trim())
    return res.status(400).json({ error: "note is required" });

  try {
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*, contract(employee_user_id)")
      .eq("id", id)
      .single();

    if (attendanceError || !attendance)
      return res.status(404).json({ error: "Attendance record not found" });

    if (attendance.contract.employee_user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const { data, error } = await supabase
      .from("attendance")
      .update({ note })
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/upload-justification", auth, upload.single("file"), async (req, res) => {
  const { attendanceId } = req.body;
  const userId = req.user.id;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file provided" });
  if (!attendanceId) return res.status(400).json({ error: "attendanceId is required" });

  try {
    const { data: attendance, error: attError } = await supabase
      .from("attendance")
      .select("*, contract(employee_user_id)")
      .eq("id", attendanceId)
      .single();

    if (attError || !attendance)
      return res.status(404).json({ error: "Attendance not found" });

    if (attendance.contract.employee_user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    const ext = file.originalname.split(".").pop();
    const fileName = `${userId}/${attendanceId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("justifications")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: urlData } = supabase.storage
      .from("justifications")
      .getPublicUrl(fileName);

    return res.json({ url: urlData.publicUrl });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});