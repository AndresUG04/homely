const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  console.log("Body recibido:", req.body);
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["employer", "employee"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const userId = authData.user.id;

  const { error: profileError } = await supabase.from("app_user").insert({
    id: userId,
    email,
    full_name,
    role,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    return res.status(500).json({ error: profileError.message });
  }

  if (role === "employer") {
    await supabase.from("employer_user").insert({ user_id: userId });
  } else {
    await supabase.from("employee_user").insert({
      user_id: userId,
      is_looking_for_job: false,
    });
  }

  const token = jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return res.status(201).json({
    message: "User registered successfully",
    token,
    user: { id: userId, email, full_name, role, avatar_url: null },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const userId = data.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("app_user")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  const token = jwt.sign(
    { id: userId, email, role: profile.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
    },
  });
});

module.exports = router;
