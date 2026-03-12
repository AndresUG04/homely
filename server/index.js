const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Homely API corriendo correctamente" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

// una prueba, se quita despues
const supabase = require("./config/supabase");

app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase.from("_test").select("*");
  if (error) {
    res.json({ status: "Supabase conectado correctamente" });
  }
});
