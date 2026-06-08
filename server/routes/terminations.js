const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

function mapUserRoleToInitiatedBy(role) {
  if (role === "employer") return "EMPLOYER";
  if (role === "employee") return "EMPLOYEE";
  return null;
}

const VALID_RESPONSES = ["ACCEPTED", "OBJECTED"];

router.post("/:id/respond", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { response, comment } = req.body || {};

    const role = mapUserRoleToInitiatedBy(req.user.role);
    if (!role) {
      return res.status(403).json({ error: "No autorizado para responder" });
    }

    if (!VALID_RESPONSES.includes(response)) {
      return res.status(400).json({ error: "Respuesta invalida" });
    }

    const normalizedComment = String(comment || "").trim();
    if (response === "OBJECTED" && !normalizedComment) {
      return res.status(400).json({ error: "El comentario es obligatorio" });
    }

    const { data: termination, error: terminationError } = await supabase
      .from("contract_termination")
      .select("id, contract_id, initiated_by")
      .eq("id", id)
      .single();

    if (terminationError || !termination) {
      return res.status(404).json({ error: "Finalizacion no encontrada" });
    }

    if (termination.initiated_by !== "SYSTEM" && termination.initiated_by === role) {
      return res.status(400).json({ error: "La parte que inicio no puede responder" });
    }

    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("id, employer_user_id, employee_user_id")
      .eq("id", termination.contract_id)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }

    if (req.user.id !== contract.employer_user_id && req.user.id !== contract.employee_user_id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const { data: existingResponses, error: existingError } = await supabase
      .from("contract_termination_response")
      .select("id")
      .eq("termination_id", id)
      .eq("user_id", req.user.id)
      .limit(1);

    if (existingError) {
      return res.status(500).json({ error: existingError.message });
    }

    if (existingResponses?.length) {
      return res.status(409).json({ error: "Ya respondiste esta finalizacion" });
    }

    const { data: insertedResponse, error: insertError } = await supabase
      .from("contract_termination_response")
      .insert({
        termination_id: id,
        user_id: req.user.id,
        role,
        response,
        comment: response === "OBJECTED" ? normalizedComment : normalizedComment || null,
      })
      .select()
      .single();

    if (insertError || !insertedResponse) {
      return res.status(500).json({ error: insertError?.message || "No se pudo guardar la respuesta" });
    }

    const { error: updateContractError } = await supabase
      .from("contract")
      .update({ status: "finalized" })
      .eq("id", termination.contract_id);

    if (updateContractError) {
      return res.status(500).json({ error: updateContractError.message });
    }

    const { data: responsesData, error: responsesError } = await supabase
      .from("contract_termination_response")
      .select(
        "id, termination_id, user_id, role, response, comment, responded_at"
      )
      .eq("termination_id", id)
      .order("responded_at", { ascending: true });

    if (responsesError) {
      return res.status(500).json({ error: responsesError.message });
    }

    const userIds = [...new Set((responsesData || []).map((r) => r.user_id).filter(Boolean))];
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

    const responses = (responsesData || []).map((r) => ({
      ...r,
      user: userMap[r.user_id] || null,
    }));

    return res.json({
      message: "Respuesta registrada",
      terminationId: id,
      response: insertedResponse,
      terminationResponses: responses || [],
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

