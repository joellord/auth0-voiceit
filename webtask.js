var express    = require('express');
var Webtask    = require('webtask-tools');
var bodyParser = require('body-parser');
var app = express();

const jwt = require('jsonwebtoken');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const uuidv4 = require('uuidv4');
const multer = require("multer")();

const expressjwt = require("express-jwt");
const jwks = require("jwks-rsa");

const BASE_URL = 'https://api.voiceit.io';
const BASE_PATH = "/tmp/";
const VOICEIT_API_TOKEN = "voiceit token";
const VOICEIT_API_KEY = "voiceit key";

function checkFileExists(filePath, callback) {
  if (!fs.existsSync(filePath)) {
    callback(Error(`File Path ${filePath} Does Not Exist`));
    return false;
  }
  return true;
}

function writeFileBuffer(buffer, extension, done){
  var filePath = `${BASE_PATH}${uuidv4()}.${extension}`;
  var wstream = fs.createWriteStream(filePath);
  wstream.write(buffer);
  wstream.on('finish', done);
  wstream.end();
  return filePath;
}

function formatResponse(callType, userId, jsonResponse){
  var jsonResponseObj = {
    'callType': callType,
    'userId': userId,
    'jsonResponse':jsonResponse
  };
  return jsonResponseObj;
}

function VoiceIt2(apk, tok) {
  this.axiosInstance = axios.create({
    auth: {
      username: apk,
      password: tok,
    },
    headers: {
      platformId: '44'
    },
  });

  this.validateToken = (userToken, callback) => {
    jwt.verify(userToken,`SECRET%_${tok}`, function(err, decodedPayload) {
    if (err) {
      callback(false);
    } else {
      callback(true, JSON.parse(decodedPayload.data));
    }
  });
  };

  this.generateTokenForUser = (userId) => {
    const token = jwt.sign({
      data: JSON.stringify({ 'userId' : userId })
    }, `SECRET%_${tok}`, { expiresIn: '168h' });
    return token;
  }

  this.initBackend = (req, res, resultCallback) => {
    const reqType = req.body.viRequestType;
    const secureToken = req.body.viSecureToken;
    const mainThis = this;
    this.validateToken(secureToken, (isValid, payloadObj) => {
      if(!isValid){
        res.json({
          'responseCode' : 'INVT',
          'message' : 'Invalid Token'
        });
        return;
      }

      const extractedUserId = payloadObj.userId;
      switch(reqType) {
          case "deleteVoiceEnrollments":
              mainThis.deleteAllVoiceEnrollments({userId: extractedUserId}, (result) =>{
                res.json(result);
              });
              break;
          case "deleteFaceEnrollments":
              mainThis.deleteAllFaceEnrollments({userId: extractedUserId}, (result) =>{
                res.json(result);
              });
              break;
          case "deleteVideoEnrollments":
              mainThis.deleteAllVideoEnrollments({userId: extractedUserId}, (result) =>{
                res.json(result);
              });
              break;
          case "enoughVoiceEnrollments":
              mainThis.getAllVoiceEnrollments({userId: extractedUserId}, (result) =>{
                if(result.responseCode === 'SUCC'){
                  if(result.count >= 3){
                    res.json({ enoughEnrollments : true});
                  } else {
                    res.json({ enoughEnrollments : false });
                  }
                } else {
                  res.json({ enoughEnrollments : false });
                }
              });
              break;
          case "enoughFaceEnrollments":
              mainThis.getAllFaceEnrollments({userId: extractedUserId}, (result) =>{
                if(result.responseCode === 'SUCC'){
                  if(result.count >= 1){
                    res.json({ enoughEnrollments : true});
                  } else {
                    res.json({ enoughEnrollments : false });
                  }
                } else {
                  res.json({ enoughEnrollments : false });
                }
              });
              break;
          case "enoughVideoEnrollments":
              mainThis.getAllVideoEnrollments({userId: extractedUserId}, (result) =>{
                if(result.responseCode === 'SUCC'){
                  if(result.count >= 3){
                    res.json({ enoughEnrollments : true});
                  } else {
                    res.json({ enoughEnrollments : false });
                  }
                } else {
                  res.json({ enoughEnrollments : false });
                }
              });
              break;
          case "createVoiceEnrollment":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, 'wav', function(){
                mainThis.createVoiceEnrollment({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  audioFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  res.json(result);
                });
              });
              break;
          case "createFaceEnrollment":
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, 'jpg', function(){
                mainThis.createFaceEnrollment({
                  userId: extractedUserId,
                  videoFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  res.json(result);
                });
              });
              break;
          case "createVideoEnrollment":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, '.mp4', function(){
                mainThis.createVideoEnrollment({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  videoFilePath: tempFilePath
                },(result) => {
                  fs.unlinkSync(tempFilePath);
                  res.json(result);
                });
              });
              break;
          case "voiceVerification":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer,'.wav', function(){
                mainThis.voiceVerification({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  audioFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  res.json(result);
                });
              });
              break;
          case "faceVerification":
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, 'mp4', function(){
                mainThis.faceVerification({
                  userId: extractedUserId,
                  videoFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  res.json(result);
                });
              });
              break;
          case "faceVerificationWithLiveness":
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, 'jpg', function(){
                mainThis.faceVerificationWithPhoto({
                    userId: extractedUserId,
                    photoFilePath: tempFilePath
                  }, (result) => {
                    fs.unlinkSync(tempFilePath);
                    resultCallback(formatResponse(reqType, extractedUserId, result));
                    res.json(result);
                });
              });
              break;
          case "videoVerification":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var tempFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, 'mp4', function(){
                mainThis.videoVerification({
                  userId: extractedUserId,
                  contentLanguage: contentLang,
                  phrase: phrase,
                  videoFilePath: tempFilePath
                }, (result) => {
                  fs.unlinkSync(tempFilePath);
                  resultCallback(formatResponse(reqType, extractedUserId, result));
                  res.json(result);
                });
              });
              break;
          case "videoVerificationWithLiveness":
              var phrase = req.body.viPhrase;
              var contentLang = req.body.viContentLanguage;
              var wavFilePath = writeFileBuffer(BASE_PATH+req.files[0].buffer, 'wav', function(){
                var jpgFilePath = writeFileBuffer(BASE_PATH+req.files[1].buffer, 'jpg', function(){
                  mainThis.videoVerificationWithPhoto({
                    userId: extractedUserId,
                    contentLanguage: contentLang,
                    phrase: phrase,
                    audioFilePath: wavFilePath,
                    photoFilePath: jpgFilePath
                  }, (result) => {
                    fs.unlinkSync(wavFilePath);
                    fs.unlinkSync(jpgFilePath);
                    resultCallback(formatResponse(reqType, extractedUserId, result));
                    res.json(result);
                  });
                });
              });
              break;
          default:
              text = "I have never heard of that fruit...";
      }

    });
  }

  /* User API Calls */

  this.createUser = (callback) => {
    this.axiosInstance.post(`${BASE_URL}/users`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.checkUserExists = (options, callback) => {
    this.axiosInstance.get(`${BASE_URL}/users/${options.userId}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.deleteUser = (options, callback) => {
    this.axiosInstance.delete(`${BASE_URL}/users/${options.userId}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  /* Enrollment API Calls */

  this.getAllVoiceEnrollments = (options, callback) => {
    this.axiosInstance.get(`${BASE_URL}/enrollments/voice/${options.userId}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.getAllFaceEnrollments = (options, callback) => {
    this.axiosInstance.get(`${BASE_URL}/enrollments/face/${options.userId}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.getAllVideoEnrollments = (options, callback) => {
    this.axiosInstance.get(`${BASE_URL}/enrollments/video/${options.userId}`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.createVoiceEnrollment = (options, callback) => {
    // if (!checkFileExists(options.audioFilePath, callback)) {
    //   return;
    // }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('recording', fs.createReadStream(options.audioFilePath), {
      filename: 'recording.wav',
    });

    this.axiosInstance.post(`${BASE_URL}/enrollments/voice`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.createFaceEnrollment = (options, callback) => {
    const form = new FormData();
    form.append('userId', options.userId);
    form.append('video', fs.createReadStream(options.videoFilePath));

    this.axiosInstance.post(`${BASE_URL}/enrollments/face`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.createVideoEnrollment = (options, callback) => {
    if (!checkFileExists(options.videoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('video', fs.createReadStream(options.videoFilePath), {
      filename: 'video.mp4',
    });

    this.axiosInstance.post(`${BASE_URL}/enrollments/video`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.deleteAllFaceEnrollments = (options, callback) => {
    this.axiosInstance.delete(`${BASE_URL}/enrollments/${options.userId}/face`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.deleteAllVoiceEnrollments = (options, callback) => {
    this.axiosInstance.delete(`${BASE_URL}/enrollments/${options.userId}/voice`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  this.deleteAllVideoEnrollments = (options, callback) => {
    this.axiosInstance.delete(`${BASE_URL}/enrollments/${options.userId}/video`)
      .then((httpResponse) => {
        callback(httpResponse.data);
      }).catch((error) => {
        callback(error.response.data);
      });
  };

  /* Verification API Calls */

  this.voiceVerification = (options, callback) => {
    if (!checkFileExists(options.audioFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('recording', fs.createReadStream(options.audioFilePath), {
      filename: 'recording.wav',
    });

    this.axiosInstance.post(`${BASE_URL}/verification/voice`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.faceVerification = (options, callback) => {
    if (!checkFileExists(options.videoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('video', fs.createReadStream(options.videoFilePath), {
      filename: 'video.mp4',
    });

    this.axiosInstance.post(`${BASE_URL}/verification/face`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.faceVerificationWithPhoto = (options, callback) => {
    if (!checkFileExists(options.photoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('photo', fs.createReadStream(options.photoFilePath), {
      filename: 'photo.jpg',
    });

    this.axiosInstance.post(`${BASE_URL}/verification/face`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.videoVerification = (options, callback) => {
    if (!checkFileExists(options.videoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('video', fs.createReadStream(options.videoFilePath), {
      filename: 'video.mp4',
    });
    this.axiosInstance.post(`${BASE_URL}/verification/video`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

  this.videoVerificationWithPhoto = (options, callback) => {
    if (!checkFileExists(options.audioFilePath, callback)) {
      return;
    }
    if (!checkFileExists(options.photoFilePath, callback)) {
      return;
    }

    const form = new FormData();
    form.append('userId', options.userId);
    form.append('contentLanguage', options.contentLanguage);
    form.append('phrase', options.phrase ? options.phrase : '');
    form.append('audio', fs.createReadStream(options.audioFilePath), {
      filename: 'audio.wav',
    });
    form.append('photo', fs.createReadStream(options.photoFilePath), {
      filename: 'photo.jpg',
    });
    this.axiosInstance.post(`${BASE_URL}/verification/video`, form, {
      headers: form.getHeaders(),
    }).then((httpResponse) => {
      callback(httpResponse.data);
    }).catch((error) => {
      callback(error.response.data);
    });
  };

}

// *********************************************




app.use(bodyParser.json());

app.post('/voiceit_endpoint', multer.any(), function (req, res) {
	const myVoiceIt = new VoiceIt2(VOICEIT_API_KEY, VOICEIT_API_TOKEN);
	myVoiceIt.initBackend(req, res, function(jsonObj){
		const callType = jsonObj.callType.toLowerCase();
		const userId = jsonObj.userId;
		if(jsonObj.jsonResponse.responseCode === "SUCC"){
			// User was successfully verified now log them in via the
			// backend, this could mean starting a new session with
			// their details, after you lookup the user with the
			// provided VoiceIt userId
			console.log("Success");
		} else {
		  console.error("Error!", jsonObj);
		}
	});
});

app.get('/voiceit_token', function (req, res) {
	// Upon a successful login, lookup the associated VoiceIt userId
	const VOICEIT_USERID = "usr_aab59d33096a40ad8f1b006989eaa848";

	// Initialize module and replace this with your own credentials
	const myVoiceIt = new VoiceIt2(VOICEIT_API_KEY, VOICEIT_API_TOKEN);

	// Generate a new token for the userId
	const createdToken = myVoiceIt.generateTokenForUser(VOICEIT_USERID);

  console.log("Generated token", createdToken);
	// Then return this token to the front end, for example as part of a jsonResponse
  res.json({
    'ResponseCode': 'SUCC',
    'Message' : 'Successfully authenticated user',
    'Token' : createdToken
  });
});

app.get('/test', (req, res) => {
  fs.readdir(BASE_PATH, (err, files) => {
    res.json(files);
  });
});

//Auth0 stuff
const auth0Config = {
  audience: "auth0 audience",
  issuer: "auth0 issuer",
};
const jwtCheck = expressjwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${auth0Config.issuer}.well-known/jwks.json`
  }),
  audience: auth0Config.audience,
  issuer: auth0Config.issues,
  algorithms: ['RS256']
});

app.get("/api/public", (req, res) => {
  res.send("Hello Public").status(200);
});

app.get("/api/private", jwtCheck, (req, res) => {
  res.send("Hello Private").status(200);
});

module.exports = Webtask.fromExpress(app);

