const { redisGeo } = require("./redisGeo");
const fs = require("fs");
const path = require("path");
const Airport = require("../models/Airport");

const GEO_KEY = "airports-geo";

function parseAirports(rawData) {
  const trimmed = rawData.trim();

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    const fixedJson = `[${trimmed.replace(/}\s*{/g, "},{")}]`;
    return JSON.parse(fixedJson);
  }
}

function normalizeAirport(airport) {
  return {
    ...airport,
    iata_faa: airport.iata_faa || airport.iata_code || airport.iata
  };
}

async function addAirportToGeo(airport) {
  if (!airport.iata_faa || airport.lat == null || airport.lng == null) {
    return;
  }

  await redisGeo.geoAdd(GEO_KEY, {
    longitude: Number(airport.lng),
    latitude: Number(airport.lat),
    member: airport.iata_faa
  });
}

async function repopulateRedisGeo(airports) {
  await redisGeo.del(GEO_KEY);

  for (const airport of airports) {
    await addAirportToGeo(airport);
  }
}

async function loadAirports() {
  const count = await Airport.countDocuments();

  if (count > 0) {
    console.log("Los aeropuertos ya están cargados en MongoDB");

    const airports = await Airport.find();
    await repopulateRedisGeo(airports);

    console.log(`${airports.length} aeropuertos cargados en Redis GEO`);
    return;
  }

  const filePath = path.join(__dirname, "../../data/airports.json");
  const rawData = fs.readFileSync(filePath, "utf-8");

  const airports = parseAirports(rawData).map(normalizeAirport);

  await Airport.insertMany(airports);
  for (const airport of airports) {
    await addAirportToGeo(airport);
  }

  console.log(`${airports.length} aeropuertos cargados en MongoDB`);
}

module.exports = loadAirports;
