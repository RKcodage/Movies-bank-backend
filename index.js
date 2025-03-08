const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// Initialisation .env
require("dotenv").config();

// Connexion DB Mongo
mongoose.connect(process.env.MONGODB_URI);

// Mmport de mes routes
const userRoutes = require("./routes/user");

// utilisation de mes routes
app.use(userRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ error: "Cette route n'existe pas" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
