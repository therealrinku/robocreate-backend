const pgClient = require("./db");

const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
);
`;

//NEED FIXING :( -->> SAD FACE
async function createTables() {
  try {
    //create users table
    await pgClient.connect();
    console.log("Connected to the database, now creating tables!");
    await pgClient.query(createUsersTableQuery);
    console.log("Table Created Successfully!");
  } catch (err) {
    console.log("Something went wrong while creating tables", err);
  }
}

createTables();
