const { db } = require("./db");

const createUsersTableQuery = `
  create table if not exists users (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    connections TEXT DEFAULT NULL,
    PRIMARY KEY(id)
);
`;

const createConnectionsTableQuery = `
  create table if not exists connections (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    fb_access_token TEXT DEFAULT NULL
);
`;

async function createTables() {
  try {
    //create users table
    await db.connect();
    console.log("Connected to the Database Successfully!");
    await db.query(createUsersTableQuery);
    await db.query(createConnectionsTableQuery);
    console.log("Table Created Successfully or they exists already.");
    process.exit(0);
  } catch (err) {
    console.log("Something went wrong while creating tables", err);
  }
}

createTables();
