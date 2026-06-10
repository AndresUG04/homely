const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

// ─── GET /api/reports/summary ─────────────────────────────────────────────────
router.get("/summary", auth, async (req, res) => {
  try {
    const employerId = req.user.id;

    // Contratos activos
    const { data: contracts, error: contractsError } = await supabase
      .from("contract")
      .select("id, salary, contract_schedule(start_time, end_time, week_day)")
      .eq("employer_user_id", employerId)
      .eq("status", "accepted");

    if (contractsError) return res.status(500).json({ error: contractsError.message });

    // Horas semanales y salario mensual (salary es por hora)
    let totalHoras = 0;
    let totalMensual = 0;

    for (const c of contracts) {
        const horasSemanales = (c.contract_schedule ?? []).reduce((acc, s) => {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        return acc + (eh + em / 60) - (sh + sm / 60);
      }, 0);

      totalHoras += horasSemanales;
      // ~4.33 semanas por mes
      totalMensual += horasSemanales * 4.33 * Number(c.salary);
    }

    // Recibos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { count: receiptsCount, error: receiptsError } = await supabase
      .from("payment_receipt")
      .select("id", { count: "exact", head: true })
      .in("contract_id", contracts.map((c) => c.id))
      .gte("period", sixMonthsAgo.toISOString().split("T")[0]);

    if (receiptsError) return res.status(500).json({ error: receiptsError.message });

    return res.json({
      activeContracts: contracts.length,
      totalMensual: Math.round(totalMensual),
      totalHoras: Math.round(totalHoras * 10) / 10,
      receiptsCount: receiptsCount ?? 0,
    });
  } catch (err) {
     console.error("REPORTS ERROR:", err);
    return res.status(500).json({ error: err.message }); 
  }
});

// ─── GET /api/reports/monthly-spend ──────────────────────────────────────────
router.get("/monthly-spend", auth, async (req, res) => {
  try {
    const employerId = req.user.id;

    const { data: contracts, error: contractsError } = await supabase
      .from("contract")
      .select("id, salary, contract_schedule(start_time, end_time)")
      .eq("employer_user_id", employerId)
      .eq("status", "accepted");

    if (contractsError) return res.status(500).json({ error: contractsError.message });

    const contractIds = contracts.map((c) => c.id);

    // Salario mensual por contrato
    const monthlySalaryMap = {};
    for (const c of contracts) {
      const horasSemanales = (c.contract_schedule ?? []).reduce((acc, s) => {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        return acc + (eh + em / 60) - (sh + sm / 60);
      }, 0);
      monthlySalaryMap[c.id] = horasSemanales * 4.33 * Number(c.salary);
    }

    // Recibos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: receipts, error: receiptsError } = await supabase
      .from("payment_receipt")
      .select("contract_id, period")
      .in("contract_id", contractIds)
      .gte("period", sixMonthsAgo.toISOString().split("T")[0])
      .order("period", { ascending: true });

    if (receiptsError) return res.status(500).json({ error: receiptsError.message });

    // Agrupar por mes
    const monthMap = {};
    for (const r of receipts) {
      const d = new Date(r.period + "T12:00:00");
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mes = d.toLocaleDateString("es-CR", { month: "short" });
      if (!monthMap[key]) monthMap[key] = { mes, total: 0 };
      monthMap[key].total += monthlySalaryMap[r.contract_id] ?? 0;
    }

    const result = Object.values(monthMap).map((m) => ({
      mes: m.mes,
      total: Math.round(m.total),
    }));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// ─── GET /api/reports/salary-load ────────────────────────────────────────────
router.get("/salary-load", auth, async (req, res) => {
  try {
    const employerId = req.user.id;

    const { data: contracts, error } = await supabase
      .from("contract")
      .select(`
        id,
        title,
        salary,
        contract_schedule(start_time, end_time, week_day),
        employee:employee_user_id(id, full_name)
      `)
      .eq("employer_user_id", employerId)
      .eq("status", "accepted");

    if (error) return res.status(500).json({ error: error.message });

    let totalMonthlySalary = 0;
    let totalWeeklyHours = 0;

    const items = contracts.map((c) => {
      const schedule = c.contract_schedule ?? [];

      const weeklyHours = schedule.reduce((acc, s) => {
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        return acc + (eh + em / 60) - (sh + sm / 60);
      }, 0);

      const monthlySalary = weeklyHours * 4.33 * Number(c.salary);
      const annualCost = monthlySalary * 12;

      totalMonthlySalary += monthlySalary;
      totalWeeklyHours += weeklyHours;

      return {
        contractId: c.id,
        employeeName: c.employee?.full_name ?? "—",
        title: c.title,
        salary: Number(c.salary),
        weeklyHours: Math.round(weeklyHours * 10) / 10,
        monthlySalary: Math.round(monthlySalary),
        annualCost: Math.round(annualCost),
        scheduleDays: schedule.map((s) => s.week_day),
      };
    });

    return res.json({
      items,
      totals: {
        totalMonthlySalary: Math.round(totalMonthlySalary),
        totalAnnualCost: Math.round(totalMonthlySalary * 12),
        totalWeeklyHours: Math.round(totalWeeklyHours * 10) / 10,
        activeContracts: contracts.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// ─── GET /api/reports/receipts ────────────────────────────────────────────────
router.get("/receipts", auth, async (req, res) => {
  try {
    const employerId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const search = req.query.search?.trim() ?? "";
    const offset = (page - 1) * limit;

    // Contratos del employer
    const { data: contracts, error: contractsError } = await supabase
      .from("contract")
      .select(`
        id,
        title,
        salary,
        employee:employee_user_id(full_name)
      `)
      .eq("employer_user_id", employerId);

    if (contractsError) return res.status(500).json({ error: contractsError.message });

    // Filtrar por búsqueda
    const filtered = search
      ? contracts.filter(
          (c) =>
            c.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.title?.toLowerCase().includes(search.toLowerCase())
        )
      : contracts;

    const contractIds = filtered.map((c) => c.id);
    if (contractIds.length === 0) return res.json({ data: [], total: 0, page });

    const contractMap = Object.fromEntries(filtered.map((c) => [c.id, c]));

    // Total
    const { count, error: countError } = await supabase
      .from("payment_receipt")
      .select("id", { count: "exact", head: true })
      .in("contract_id", contractIds);

    if (countError) return res.status(500).json({ error: countError.message });

    // Página
    const { data: receipts, error: receiptsError } = await supabase
      .from("payment_receipt")
      .select("id, contract_id, period, file_name")
      .in("contract_id", contractIds)
      .order("period", { ascending: false })
      .range(offset, offset + limit - 1);

    if (receiptsError) return res.status(500).json({ error: receiptsError.message });

    const data = receipts.map((r) => {
      const c = contractMap[r.contract_id];
      return {
        id: r.id,
        contractId: r.contract_id,
        employeeName: c?.employee?.full_name ?? "—",
        title: c?.title ?? "—",
        period: r.period,
        amount: null, // se calcula en frontend si se necesita, o podés agregarlo
      };
    });

    return res.json({ data, total: count ?? 0, page });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// ─── GET /api/reports/receipts/:id/download ───────────────────────────────────
router.get("/receipts/:id/download", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: receipt, error } = await supabase
      .from("payment_receipt")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (error || !receipt) return res.status(404).json({ error: "Recibo no encontrado" });

    const { data, error: urlError } = await supabase.storage
      .from("payments")
      .createSignedUrl(receipt.storage_path, 60 * 60);

    if (urlError) return res.status(500).json({ error: urlError.message });

    return res.json({ url: data.signedUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;