const { redisGeo } = require("../services/redisGeo");
const { redisPopularity } = require("../services/redisPopularity");
const express = require("express");
const router = express.Router();
const Airport = require("../models/Airport");

const GEO_KEY = "airports-geo";
const POPULARITY_KEY = "airport_popularity";

function normalizeAirportPayload(payload) {
  if (!payload) {
    return payload;
  }

  return {
    ...payload,
    iata_faa: payload.iata_faa || payload.iata_code || payload.iata
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

router.get("/", async (req, res) => {
  try {
    const airports = await Airport.find();

    res.json(airports);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});
router.post("/", async (req, res) => {
  try {
    const payload = normalizeAirportPayload(req.body);

    if (!payload.iata_faa) {
      return res.status(400).json({
        error: "El campo iata_faa o iata_code es obligatorio"
      });
    }

    const existingAirport = await Airport.findOne({ iata_faa: payload.iata_faa });
    if (existingAirport) {
      return res.status(409).json({
        error: "Ya existe un aeropuerto con ese codigo IATA"
      });
    }

    const airport = await Airport.create(payload);

    await addAirportToGeo(airport);

    res.status(201).json(airport);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.get("/popular", async (req, res) => {
  try {

    const popular = await redisPopularity.zRangeWithScores(
      POPULARITY_KEY,
      0,
      -1,
      { REV: true }
    );

    res.json(popular);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
});

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return res.status(400).json({
        error: "Faltan parámetros lat, lng o radius"
      });
    }

    const nearbyCodes = await redisGeo.geoSearch(
      GEO_KEY,
      {
        longitude: Number(lng),
        latitude: Number(lat)
      },
      {
        radius: Number(radius),
        unit: "km"
      }
    );

    const airports = await Airport.find({
      iata_faa: { $in: nearbyCodes }
    });

    res.json(airports);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.put("/:iata", async (req, res) => {
  try {
    const payload = normalizeAirportPayload(req.body);

    if (payload.iata_faa && payload.iata_faa !== req.params.iata) {
      const existingAirport = await Airport.findOne({ iata_faa: payload.iata_faa });
      if (existingAirport) {
        return res.status(409).json({
          error: "Ya existe un aeropuerto con ese codigo IATA"
        });
      }
    }

    const airport = await Airport.findOneAndUpdate(
      { iata_faa: req.params.iata },
      payload,
      { new: true }
    );

    if (!airport) {
      return res.status(404).json({
        error: "Aeropuerto no encontrado"
      });
    }

    if (airport.iata_faa !== req.params.iata) {
      await redisGeo.zRem(GEO_KEY, req.params.iata);
      await redisPopularity.zRem(POPULARITY_KEY, req.params.iata);
    }

    await addAirportToGeo(airport);

    res.json(airport);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.delete("/:iata", async (req, res) => {
  try {
    const airport = await Airport.findOneAndDelete({
      iata_faa: req.params.iata
    });

    if (!airport) {
      return res.status(404).json({
        error: "Aeropuerto no encontrado"
      });
    }

    await redisGeo.zRem(GEO_KEY, req.params.iata);
    await redisPopularity.zRem(POPULARITY_KEY, req.params.iata);

    res.json({
      message: "Aeropuerto eliminado correctamente",
      airport
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.get("/:iata", async (req, res) => {
  try {

    const airport = await Airport.findOne({
      iata_faa: req.params.iata
    });

    if (!airport) {
      return res.status(404).json({
        error: "Aeropuerto no encontrado"
      });
    }

    await redisPopularity.zIncrBy(
      POPULARITY_KEY,
      1,
      airport.iata_faa
    );

    await redisPopularity.expire(
      POPULARITY_KEY,
      86400
    );

    res.json(airport);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
