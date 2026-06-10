const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const { data, error } = await supabase
    .from("task")
    .select("id, name, description")
    .order("name");

  if (error) return res.status(500).json({ error: error.message });

  return res.json({ tasks: data });
});

module.exports = router;