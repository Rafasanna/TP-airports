const { connectRedisGeo } = require("./services/redisGeo");
const { connectRedisPopularity } = require("./services/redisPopularity");
const airportRoutes = require("./routes/airportsRoutes");
const loadAirports = require("./services/loadAirports");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./services/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/airports", airportRoutes);

connectDB().then(async () => {
  await connectRedisPopularity();
  await connectRedisGeo();
  await loadAirports();
});

app.get("/", (req, res) => {
    res.send("API Airports funcionando");
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});