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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

airportSchema.virtual("iata_code").get(function () {
  return this.iata_faa;
});

airportSchema.virtual("iata").get(function () {
  return this.iata_faa;
});

module.exports = mongoose.model("Airport", airportSchema);