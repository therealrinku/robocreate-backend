const express = require("express");
const http = require("http");

const app = express();

const server = http.createServer(app);

server.listen(process.env.PORT || 5000, () => console.log("I ran"));
