const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");
const notify = require("../utils/notify"); 

const { v4: uuidv4 } = require("uuid");

router.post("/:contractId/payments", auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { fileBase64, fileName, month } = req.body;

    if (!fileBase64 || !fileName || !month) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // 1. Validar contrato
    const { data: contract, error: contractError } = await supabase
      .from("contract")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return res.status(404).json({ error: "Contrato no encontrado" });
    }

    // 2. Validar duplicado (mes)
    const periodDate = new Date(month + "-01");

    const { data: existing } = await supabase
      .from("payment_receipt")
      .select("id")
      .eq("contract_id", contractId)
      .eq("period", periodDate.toISOString().split("T")[0])
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: "Ya existe un comprobante para este mes" });
    }

    // 3. Decodificar base64
    const buffer = Buffer.from(fileBase64, "base64");

    const ext = fileName.split(".").pop().toLowerCase();
    const mimeMap = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };

    const contentType = mimeMap[ext] ?? "application/octet-stream";
    const fileId = uuidv4();
    const storagePath = `contracts/${contractId}/payments/${fileId}.${ext}`;

    // 4. Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("payments")
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    // 5. Insertar en DB
    const { data, error } = await supabase
      .from("payment_receipt")
      .insert({
        contract_id: contractId,
        period: periodDate,
        file_name: `${month}_${fileName}`,
        storage_path: storagePath,
        mime_type: contentType,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // ── NOTIFY: avisar al empleado que recibió un comprobante de pago ──
    // El que sube el pago es el empleador → notificar al empleado
    await notify({
      userId: contract.employee_user_id,
      title: "Comprobante de pago recibido 💰",
      message: `Tu empleadora subió el comprobante de pago del mes ${month}.`,
      type: "payment_received",
      referenceId: contractId, // usamos contractId para navegar a /payments/:contractId
    });

    return res.json({ message: "Comprobante subido correctamente", receipt: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/:contractId/payments", auth, async (req, res) => {
  try {
    const { contractId } = req.params;

    const { data, error } = await supabase
      .from("payment_receipt")
      .select("*")
      .eq("contract_id", contractId)
      .order("period", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ payments: data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

router.get("/:contractId/payments/:paymentId/url", auth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const { data: receipt } = await supabase
      .from("payment_receipt")
      .select("storage_path")
      .eq("id", paymentId)
      .single();

    console.log("storage_path en DB:", receipt?.storage_path);

    const { data, error } = await supabase.storage
      .from("payments")
      .createSignedUrl(receipt.storage_path, 60 * 60);

    console.log("Supabase error:", error);
    console.log("Signed URL data:", data);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ url: data.signedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;