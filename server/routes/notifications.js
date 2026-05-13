const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

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