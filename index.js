//LOAD ENV
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
var cookieParser = require("cookie-parser");

const { db } = require("./database/db");

db.connect()
  .then(() => console.log("Connected to the db"))
  .catch((err) => console.log("Can't connect to the db", err));

const app = express();

const server = http.createServer(app);

app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const usersRoute = require("./routes/users");
app.use("/users", usersRoute);

server.listen(process.env.PORT, () => console.log(`Express is running at port ${process.env.PORT}`));
