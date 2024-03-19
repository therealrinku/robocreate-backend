const { createClient } = require("redis/dist/index");

const redis = createClient({ url: process.env.REDIS_URL });

redis.connect();

module.exports = { redis };
