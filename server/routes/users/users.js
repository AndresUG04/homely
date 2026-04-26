const express = require("express");
const router = express.Router();
const supabase = require("../../config/supabase");
const auth = require("../../middleware/auth");

const parseOptionalBoolean = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  const normalized = String(value).toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return "invalid";
};

// GET /api/users/workers
router.get("/workers", auth, async (req, res) => {
  if (req.user.role !== "employer") {
    return res.status(403).json({ error: "Solo empleadores pueden buscar trabajadoras" });
  }

  const country = (req.query.country || "").trim();
  const state = (req.query.state || "").trim();
  const city = (req.query.city || "").trim();
  const lookingForJob = parseOptionalBoolean(req.query.is_looking_for_job);

  if (lookingForJob === "invalid") {
    return res.status(400).json({ error: "is_looking_for_job debe ser true o false" });
  }

  let filteredAddressIds = null;
  if (country || state || city) {
    let addressQuery = supabase.from("address").select("id");

    if (country) addressQuery = addressQuery.ilike("country", `%${country}%`);
    if (state) addressQuery = addressQuery.ilike("state", `%${state}%`);
    if (city) addressQuery = addressQuery.ilike("city", `%${city}%`);

    const { data: addressRows, error: addressError } = await addressQuery;
    if (addressError) return res.status(500).json({ error: addressError.message });

    filteredAddressIds = (addressRows || []).map((row) => row.id);
    if (!filteredAddressIds.length) {
      return res.json({ workers: [] });
    }
  }

  let usersQuery = supabase
    .from("app_user")
    .select("id, full_name, email, phone, age, language, address_id")
    .eq("role", "employee");

  if (filteredAddressIds) {
    usersQuery = usersQuery.in("address_id", filteredAddressIds);
  }

  const { data: users, error: usersError } = await usersQuery;
  if (usersError) return res.status(500).json({ error: usersError.message });
  if (!users || !users.length) return res.json({ workers: [] });

  const userIds = users.map((user) => user.id);
  let employeeQuery = supabase
    .from("employee_user")
    .select("user_id, biography, is_looking_for_job")
    .in("user_id", userIds);

  if (lookingForJob !== null) {
    employeeQuery = employeeQuery.eq("is_looking_for_job", lookingForJob);
  }

  const { data: employeeRows, error: employeeError } = await employeeQuery;
  if (employeeError) return res.status(500).json({ error: employeeError.message });

  const employeeByUserId = new Map((employeeRows || []).map((row) => [row.user_id, row]));
  const matchedUsers = users.filter((user) => employeeByUserId.has(user.id));
  if (!matchedUsers.length) return res.json({ workers: [] });

  const addressIds = [...new Set(matchedUsers.map((user) => user.address_id).filter(Boolean))];
  let addressById = new Map();

  if (addressIds.length) {
    const { data: addresses, error: addressesError } = await supabase
      .from("address")
      .select("id, country, state, city, postal_code, address_line_1, address_line_2")
      .in("id", addressIds);

    if (addressesError) return res.status(500).json({ error: addressesError.message });
    addressById = new Map((addresses || []).map((row) => [row.id, row]));
  }

  const workers = matchedUsers
    .map((user) => {
      const extension = employeeByUserId.get(user.id);
      return {
        ...user,
        role: "employee",
        biography: extension?.biography || null,
        is_looking_for_job: extension?.is_looking_for_job ?? false,
        address: user.address_id ? addressById.get(user.address_id) || null : null,
      };
    })
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

  return res.json({ workers });
});

// GET /api/users/profile
router.get("/profile", auth, async (req, res) => {
  const { data: user, error } = await supabase
    .from("app_user")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  let address = null;
  if (user.address_id) {
    const { data } = await supabase
      .from("address")
      .select("*")
      .eq("id", user.address_id)
      .single();
    address = data;
  }

  let extension = {};
  if (user.role === "employee") {
    const { data } = await supabase
      .from("employee_user")
      .select("biography, is_looking_for_job")
      .eq("user_id", req.user.id)
      .single();
    if (data) extension = data;
  } else if (user.role === "employer") {
    const { data } = await supabase
      .from("employer_user")
      .select("description")
      .eq("user_id", req.user.id)
      .single();
    if (data) extension = data;
  }
  const { data: workHistory } = await supabase
    .from("work_history")
    .select(`
      id,
      title,
      description,
      start_date,
      end_date,
      status,
      work_history_task (
        task:task_id (
          id,
          name,
          description,
          task_type
        )
      )
    `)
    .eq("app_user_id", req.user.id);
  return res.json({ 
    user: {...user, address, ...extension , work_history: workHistory || []} 
  });
});

// PUT /api/users/profile
router.put("/profile", auth, async (req, res) => {
  const {
    full_name,
    phone,
    age,
    language,
    address,
    biography,
    is_looking_for_job,
    description,
  } = req.body;

  if (!full_name || !full_name.trim()) {
    return res.status(400).json({ error: "El nombre es requerido" });
  }

  const { data: currentUser, error: fetchError } = await supabase
    .from("app_user")
    .select("address_id, role")
    .eq("id", req.user.id)
    .single();

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  let address_id = currentUser.address_id;

  if (address && Object.values(address).some((v) => v)) {
    if (address_id) {
      await supabase.from("address").update(address).eq("id", address_id);
    } else {
      const { data: newAddress, error: addrError } = await supabase
        .from("address")
        .insert(address)
        .select()
        .single();
      if (addrError) return res.status(500).json({ error: addrError.message });
      address_id = newAddress.id;
    }
  }

  const updateData = {
    full_name: full_name.trim(),
    phone: phone || null,
    age: age ? parseInt(age) : null,
    language: language || "es",
    address_id,
  };

  const { data, error } = await supabase
    .from("app_user")
    .update(updateData)
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (currentUser.role === "employee") {
    await supabase
      .from("employee_user")
      .update({
        biography: biography || null,
        is_looking_for_job: is_looking_for_job ?? true,
      })
      .eq("user_id", req.user.id);
  } else if (currentUser.role === "employer") {
    await supabase
      .from("employer_user")
      .update({ description: description || null })
      .eq("user_id", req.user.id);
  }

  let updatedAddress = null;
  if (address_id) {
    const { data: addr } = await supabase
      .from("address")
      .select("*")
      .eq("id", address_id)
      .single();
    updatedAddress = addr;
  }

  return res.json({
    user: {
      ...data,
      address: updatedAddress,
      ...(currentUser.role === "employee" ? { biography, is_looking_for_job } : {}),
      ...(currentUser.role === "employer" ? { description } : {}),
    },
  });
});

// PUT /api/users/password
router.put("/password", auth, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  if (new_password.length < 6) {
    return res
      .status(400)
      .json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: req.user.email,
    password: current_password,
  });

  if (signInError) {
    return res.status(401).json({ error: "La contraseña actual es incorrecta" });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    req.user.id,
    { password: new_password }
  );

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  return res.json({ message: "Contraseña actualizada correctamente" });
});

module.exports = router;

// PUT /api/users/work-history
router.post("/work-history", auth, async (req, res) => {
  const { title, description, startDate, endDate, status, tasks } = req.body;

  const { data: work, error: workError } = await supabase
    .from("work_history")
    .insert({
      app_user_id: req.user.id,
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      status: status
    })
    .select()
    .single();

  if (workError) {
    return res.status(500).json({ error: workError.message });
  }

  for (const t of tasks) {
    let taskId;

    const { data: existing } = await supabase
      .from("task")
      .select("*")
      .eq("name", t.name)
      .maybeSingle();

    if (existing) {
      taskId = existing.id;
    } else {
      const { data: newTask } = await supabase
        .from("task")
        .insert({
          name: t.name,
          description: t.description,
          task_type: t.task_type
        })
        .select()
        .single();

      taskId = newTask.id;
    }

    await supabase.from("work_history_task").insert({
      work_history_id: work.id,
      task_id: taskId
    });
  }

  return res.json({
    message: "Work history created successfully",
    work
  });
});

// DELETE /api/users/work-history/:id
router.delete("/work-history/:id", auth, async (req, res) => {
  const { id } = req.params;

  const { data: work, error: fetchError } = await supabase
    .from("work_history")
    .select("id")
    .eq("id", id)
    .eq("app_user_id", req.user.id)
    .single();

  if (fetchError || !work) {
    return res.status(404).json({ error: "Work history no encontrado" });
  }

  const { error: deleteError } = await supabase
    .from("work_history")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return res.status(500).json({ error: deleteError.message });
  }

  return res.json({ message: "Work history eliminado correctamente" });
});