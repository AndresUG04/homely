const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");
const { getNotifyContent } = require("../utils/notifyMessages");

// GET /api/notifications
router.get("/", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const reconstructData = async (type, referenceId) => {
  if (!referenceId) return null;

  if (type.startsWith("contract_")) {
    const { data: contract } = await supabase
      .from("contracts")
      .select("title")
      .eq("id", referenceId)
      .single();
    if (contract) return { title: contract.title };
  }

  if (type.startsWith("invitation_")) {
    const { data: invitation } = await supabase
      .from("job_offer_invitation")
      .select("job_offer_id")
      .eq("id", referenceId)
      .single();
    if (invitation) {
      const { data: job } = await supabase
        .from("job")
        .select("title")
        .eq("id", invitation.job_offer_id)
        .single();
      if (job) return { title: job.title };
    }
  }

  if (type.startsWith("application_")) {
    const { data: app } = await supabase
      .from("job_offer_application")
      .select("job_offer_id")
      .eq("id", referenceId)
      .single();
    if (app) {
      const { data: job } = await supabase
        .from("job")
        .select("title")
        .eq("id", app.job_offer_id)
        .single();
      if (job) return { title: job.title };
    }
  }

  if (type.startsWith("task_")) {
    const { data: task } = await supabase
      .from("assigned_task")
      .select("name")
      .eq("id", referenceId)
      .single();
    if (task) return { name: task.name };
  }

  if (type.startsWith("attendance_")) {
    const { data: record } = await supabase
      .from("attendance")
      .select("work_date")
      .eq("id", referenceId)
      .single();
    if (record) return { date: record.work_date };
  }

  return null;
};

// POST /api/notifications/retranslate
router.post("/retranslate", auth, async (req, res) => {
  const { data: notifications, error: fetchError } = await supabase
    .from("notifications")
    .select("id, type, data, reference_id")
    .eq("user_id", req.user.id);

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  let filled = 0;
  let translated = 0;

  for (const n of notifications) {
    let data = n.data;

    if (!data) {
      data = await reconstructData(n.type, n.reference_id);
      if (!data) continue;
      await supabase
        .from("notifications")
        .update({ data })
        .eq("id", n.id);
      filled++;
    }

    const { title, message } = await getNotifyContent(supabase, n.type, req.user.id, data);
    await supabase
      .from("notifications")
      .update({ title, message })
      .eq("id", n.id);
    translated++;
  }

  res.json({ success: true, filled, translated });
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", auth, async (req, res) => {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", req.params.id)
    .eq("user_id", req.user.id);

  res.json({ success: true });
});

// PATCH /api/notifications/read-all
router.patch("/read-all", auth, async (req, res) => {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", req.user.id);

  res.json({ success: true });
});

module.exports = router;