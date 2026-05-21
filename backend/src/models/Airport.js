const mongoose = require("mongoose");

const airportSchema = new mongoose.Schema({
  name: String,
  city: String,
  iata_faa: {
    type: String,
    index: true
  },
  icao: String,
  lat: Number,
  lng: Number,
  alt: Number,
  tz: String
});

module.exports = mongoose.model("Airport", airportSchema);