const express = require("express");
const app = express();
const mongoose = require("mongoose");

const MONGO_URL = "mongodb://127.0.0.1:27017/MyNewProject";

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log("DB Connection Error:", err));

// Home route
app.get("/", (req, res) => {
  res.send("Hi I am YatraStay");
});

// --- Start server ---
app.listen(8080, () => {
  console.log("Server is listening on port 8080");
});