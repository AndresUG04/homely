const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth");

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

  return res.json({ user: { ...user, address, ...extension } });
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
