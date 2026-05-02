const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// GET /api/attendance/:contractId/:year/:month - Get attendance by month
router.get("/:contractId/:year/:month", auth, async (req, res) => {
  const { contractId, year, month } = req.params;
  const userId = req.user.id;

  try {
    // Verify contract belongs to the authenticated user
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const end = new Date(year, month, 0).toISOString().split("T")[0];

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

// POST /api/attendance/check-in - Mark check-in
router.post("/check-in", auth, async (req, res) => {
  const { contractId } = req.body;
  const userId = req.user.id;

  try {
    // Verify contract belongs to the authenticated employee
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("*, contract_schedule(*)")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const today = new Date();
    const workDate = today.toISOString().split("T")[0];

    // Verify today is a work day according to the contract
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const todayName = days[today.getDay()];
    const schedule = contract.contract_schedule.find(s => s.week_day === todayName);

    if (!schedule)
      return res.status(400).json({ error: "Today is not a work day for this contract" });

    // Check if already checked in today
    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .eq("work_date", workDate)
      .maybeSingle();

    if (existing?.check_in)
      return res.status(400).json({ error: "Already checked in today" });

    const checkIn = today.toISOString();

    // Calculate status: punctual or late (10 min grace period)
    const [scheduleHour, scheduleMin] = schedule.start_time.split(":").map(Number);
    const limitTime = new Date(today);
    limitTime.setHours(scheduleHour, scheduleMin + 10, 0, 0);

    const status = today <= limitTime ? "Puntual" : "Tardía";

    if (existing) {
      const { data, error } = await supabase
        .from("attendance")
        .update({ check_in: checkIn, status })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ attendance: data });
    }

    const { data, error } = await supabase
      .from("attendance")
      .insert({ contract_id: contractId, work_date: workDate, check_in: checkIn, status })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/attendance/check-out - Mark check-out
router.post("/check-out", auth, async (req, res) => {
  const { contractId } = req.body;
  const userId = req.user.id;

  try {
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("*, contract_schedule(*)")
      .eq("id", contractId)
      .eq("employee_user_id", userId)
      .single();

    if (contractError || !contract)
      return res.status(403).json({ error: "Unauthorized" });

    const today = new Date();
    const workDate = today.toISOString().split("T")[0];

    // Find today's attendance record
    const { data: existing } = await supabase
      .from("attendance")
      .select("*")
      .eq("contract_id", contractId)
      .eq("work_date", workDate)
      .maybeSingle();

    if (!existing?.check_in)
      return res.status(400).json({ error: "No check-in found for today" });

    if (existing?.check_out)
      return res.status(400).json({ error: "Already checked out today" });

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const todayName = days[today.getDay()];
    const schedule = contract.contract_schedule.find(s => s.week_day === todayName);

    const checkOut = today.toISOString();

    // Calculate final status
    const [endHour, endMin] = schedule.end_time.split(":").map(Number);
    const endLimit = new Date(today);
    endLimit.setHours(endHour, endMin - 10, 0, 0);

    const [startHour, startMin] = schedule.start_time.split(":").map(Number);
    const startLimit = new Date(today);
    startLimit.setHours(startHour, startMin + 10, 0, 0);

    const checkInTime = new Date(existing.check_in);

    let status;
    if (today < endLimit && checkInTime > startLimit) status = "Tardía";
    else if (today < endLimit) status = "Salida Anticipada";
    else status = checkInTime > startLimit ? "Tardía" : "Puntual";

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

// PATCH /api/attendance/:id/justify - Add justification
router.patch("/:id/justify", auth, async (req, res) => {
  const { id } = req.params;
  const { justification } = req.body;
  const userId = req.user.id;

  try {
    if (!justification || !justification.trim())
      return res.status(400).json({ error: "Justification is required" });

    // Verify attendance belongs to the authenticated user
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
    return res.json({ attendance: data });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;