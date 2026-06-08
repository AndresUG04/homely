const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const jobRoutes = require("./routes/jobs");
const contractRoutes = require("./routes/contracts");
const terminationRoutes = require("./routes/terminations");
const attendanceRoutes = require("./routes/attendance");
const taskRoutes = require("./routes/tasks");
const jobApplicationRoutes = require("./routes/jobApplications");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Homely API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/terminations", terminationRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/job-applications", jobApplicationRoutes);
app.use("/api/notifications", require("./routes/notifications"));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
