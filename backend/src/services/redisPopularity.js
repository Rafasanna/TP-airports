const { createClient } = require("redis");

const redisPopularity = createClient({
  url: "redis://localhost:6379"
});

redisPopularity.on("error", (err) => {
  console.error("Error Redis Popularidad:", err);
});

async function connectRedisPopularity() {
  if (!redisPopularity.isOpen) {
    await redisPopularity.connect();
    console.log("Redis Popularidad conectado");
  }
}

module.exports = {
  redisPopularity,
  connectRedisPopularity
};