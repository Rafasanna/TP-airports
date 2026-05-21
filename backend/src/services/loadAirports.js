const { redisGeo } = require("./redisGeo");
const fs = require("fs");
const path = require("path");
const Airport = require("../models/Airport");

async function loadAirports() {
  const count = await Airport.countDocuments();

  if (count > 0) {
  console.log("Los aeropuertos ya están cargados en MongoDB");

  const airports = await Airport.find();

  for (const airport of airports) {
    if (airport.iata_faa && airport.lat && airport.lng) {
      await redisGeo.geoAdd("airports-geo", {
        longitude: airport.lng,
        latitude: airport.lat,
        member: airport.iata_faa
      });
    }
  }

  console.log(`${airports.length} aeropuertos cargados en Redis GEO`);
  return;
}

  const filePath = path.join(__dirname, "../../data/data_trasport.json");
  const rawData = fs.readFileSync(filePath, "utf-8");

  const fixedJson = `[${rawData.trim().replace(/}\s*{/g, "},{")}]`;
  const airports = JSON.parse(fixedJson);

  await Airport.insertMany(airports);
  for (const airport of airports) {
  if (airport.iata_faa && airport.lat && airport.lng) {
    await redisGeo.geoAdd("airports-geo", {
      longitude: airport.lng,
      latitude: airport.lat,
      member: airport.iata_faa
    });
  }
}

  console.log(`${airports.length} aeropuertos cargados en MongoDB`);
}

module.exports = loadAirports;