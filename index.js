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

app.get("/voiceit_token", (req, res) => {
  // Upon a successful login, lookup the associated VoiceIt userId
  const VOICEIT_USERID = req.query.userId;
  // Initialize module
  const myVoiceIt = new VoiceIt2(config.VOICEIT_API_KEY, config.VOICEIT_API_TOKEN);

  // If a userId is provided, do a verification.  If not, assume this is an
  // enrollment and create a new userId to be associated with the Auth0 user
  if (VOICEIT_USERID) {
    // Generate a new token for the userId
    const createdToken = myVoiceIt.generateTokenForUser(VOICEIT_USERID);

    // Then return this token to the front end, for example as part of a jsonResponse
    res.json({
      "ResponseCode": "SUCC",
      "Message" : "Successfully authenticated user",
      "Token" : createdToken
    });
  } else {
    myVoiceIt.createUser(user => {
      let userId = user.userId;
      const createdToken = myVoiceIt.generateTokenForUser(userId);
      res.json({
        "ResponseCode": "SUCC",
        "Message" : "Successfully created new user",
        "Token" : createdToken,
        "userId": userId
      });
    });
  }
});

app.post("/voiceit_endpoint", multer.any(), (req, res) => {
  const myVoiceIt = new VoiceIt2(config.VOICEIT_API_KEY, config.VOICEIT_API_TOKEN);
  myVoiceIt.initBackend(req, res, function(jsonObj){
    const callType = jsonObj.callType.toLowerCase();
    const userId = jsonObj.userId;

    // Build a JWT proving the user was authenticated or not
    let token = jwt.sign({
      userId: userId,
      userAuthenticated: (jsonObj.jsonResponse.responseCode === "SUCC")
    }, "auth0-voiceit-shared");

    // Add the JWT to the JSON response
    jsonObj.jsonResponse.token = token;

    if(jsonObj.jsonResponse.responseCode === "SUCC"){
      console.log(`User ${jsonObj.userId} Authenticated/Enrolled`);
    } else {
      console.error("Error!", jsonObj);
    }
  });
});

app.listen("5000", () => console.log("Server started on port 5000"));
