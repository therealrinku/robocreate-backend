const pg = require("pg");

const pgClient = new pg.Client(process.env.POSTGRES_DB_URL);

pgClient.connect(() => console.log("Connected to Roboshare POSTGRES Database"));

module.exports = pgClient;
