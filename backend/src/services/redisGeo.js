const { createClient } = require("redis");

const redisGeo = createClient({
  url: "redis://localhost:6380"
});

redisGeo.on("error", (err) => {
  console.error("Error Redis GEO:", err);
});

async function connectRedisGeo() {
  if (!redisGeo.isOpen) {
    await redisGeo.connect();
    console.log("Redis GEO conectado");
  }
}

module.exports = {
  redisGeo,
  connectRedisGeo
};