const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

//LOAD ENV
dotenv.config();

const { db } = require("./database/db");

db.connect()
  .then(() => console.log("Connected to the db"))
  .catch((err) => console.log("Can't connect to the db", err));

const app = express();

const server = http.createServer(app);

app.use(cors({ origin: ["https://robocreate.vercel.app"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

const usersRoute = require("./routes/users");
const connectionsRoute = require("./routes/connections");
const chatRoute  = require("./routes/chat");

app.use("/users", usersRoute);
app.use("/connections", connectionsRoute);
app.use("/api/v1/chat", chatRoute);

//first landing route
app.get("/", (_, res) => res.status(200).send({ message: "Robocreate API is ready to serve." }));

server.listen(process.env.PORT, () => console.log(`Express is running at port ${process.env.PORT}`));
