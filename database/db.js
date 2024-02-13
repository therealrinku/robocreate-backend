const pg = require("pg");

const db = new pg.Client(process.env.POSTGRES_DB_URL);

module.exports = { db };
