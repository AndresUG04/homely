const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// GET all contracts
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  const field = role === "employer" ? "employer_user_id" : "employee_user_id";
  
  const { data, error } = await supabase
    .from("contract")
    .select(`
      *,
      contract_schedule (*),
      employee:employee_user_id ( id, full_name ),
      employer:employer_user_id ( id, full_name )
    `)
    .eq(field, userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

//GET contract by ID with your schedule
router.get("/:id", auth, async (req, res) => {
    const {id} = req.params;
    const userId = req.user.id;

    const {data, error} = await supabase
        .from("contract")
        .select(`
            *,
            contract_schedule (*)
    `)
    .eq("id",id)
    .eq("employee_user_id", userId)
    .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Contrato no encontrado" });
    return res.json(data);
        
});

module.exports = router;