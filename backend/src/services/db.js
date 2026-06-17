const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/airport_db";

    await mongoose.connect(mongoUri);

    console.log("MongoDB conectado");
  } catch (error) {
    console.error("Error MongoDB:", error);
  }
}

module.exports = connectDB;
