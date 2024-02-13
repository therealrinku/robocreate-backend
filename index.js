const express = require("express");
const http = require("http");
const cors = require("cors");

//LOAD ENV
require("dotenv").config();

const app = express();

//ALLOW ALL FOR NOW
app.use(cors());

const server = http.createServer(app);

server.listen(process.env.PORT, () => console.log("I ran"));
