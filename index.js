// Server requires
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

// VoiceIt requires
const VoiceIt2 = require("./voiceit2");
const multer = require("multer")();
const jwt = require("jsonwebtoken");

// API requires
const randopeep = require("randopeep");
const expressjwt = require("express-jwt");
const jwks = require("jwks-rsa");

// Config
const config = require("./config");

app.use(bodyParser.json());
app.use(cors());

// Serve the files from /client
app.use(express.static("./client"));

//Auth0 configuration and JWT check options
const auth0Config = {
  audience: config.AUTH0_AUDIENCE,
  issuer: config.AUTH0_DOMAIN,
};

const jwtCheck = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${auth0Config.issuer}.well-known/jwks.json`
  }),
  audience: auth0Config.audience,
  issuer: auth0Config.issuer,
  algorithms: ['RS256']
});

// This is a public endpoint that returns randomly generated clickbait headlines
app.get("/api/public", (req, res) => {
  res.send(randopeep.clickbait.headline()).status(200);
});

// This endpoint requires a valid Auth0 JWT and will respond back with a randomly
// generated clickbait headline featuring yours truly
app.get("/api/private/:name?", jwtCheck, (req, res) => {
  let name = req.params.name || "you";
  res.send(randopeep.clickbait.headline(name)).status(200);
});

app.listen("5000", () => console.log("Server started on port 5000"));
