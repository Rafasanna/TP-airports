const { redisGeo } = require("../services/redisGeo");
const { redisPopularity } = require("../services/redisPopularity");
const express = require("express");
const router = express.Router();
const Airport = require("../models/Airport");

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
    const airport = await Airport.create(req.body);

    if (airport.iata_faa && airport.lat && airport.lng) {
      await redisGeo.geoAdd("airports-geo", {
        longitude: airport.lng,
        latitude: airport.lat,
        member: airport.iata_faa
      });
    }

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
      "airport_popularity",
      0,
      10,
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
      "airports-geo",
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
    const airport = await Airport.findOneAndUpdate(
      { iata_faa: req.params.iata },
      req.body,
      { new: true }
    );

    if (!airport) {
      return res.status(404).json({
        error: "Aeropuerto no encontrado"
      });
    }

    if (airport.iata_faa && airport.lat && airport.lng) {
      await redisGeo.geoAdd("airports-geo", {
        longitude: airport.lng,
        latitude: airport.lat,
        member: airport.iata_faa
      });
    }

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

    await redisGeo.zRem("airports-geo", req.params.iata);
    await redisPopularity.zRem("airport_popularity", req.params.iata);

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
      "airport_popularity",
      1,
      req.params.iata
    );

    await redisPopularity.expire(
      "airport_popularity",
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