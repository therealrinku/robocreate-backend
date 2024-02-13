const { db } = require("./db");

const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
);
`;

async function createTables() {
  try {
    //create users table
    await db.connect();
    console.log("Connected to the Database Successfully!");
    await db.query(createUsersTableQuery);
    console.log("Table Created Successfully!");
    process.exit(0);
  } catch (err) {
    console.log("Something went wrong while creating tables", err);
  }
}

createTables();
