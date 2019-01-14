let VoiceItHelper = function(options) {
  this.options = options;
  this.enroll = this.options.userId ? false : true;

  this.ENDPOINT_URL = "http://localhost:5000/voiceit_endpoint";
  this.TOKEN_URL = "http://localhost:5000/voiceit_token";

  this.voiceItInstance = new VoiceIt2.initialize(this.ENDPOINT_URL, "./vendor/face_detector.wasm");

  this.getToken = function() {
    let url = `${this.TOKEN_URL}`;
    let self = this;

    return fetch(url).then(resp => resp.json()).then(data => {
      self.voiceItInstance.setSecureToken(data.Token);
      self.options.userId = data.userId;
    });
  };

  this.verify = function() {
    let self = this;
    let nextStep = "encapsulatedFaceEnrollment";

    let voiceItOptions = {
      completionCallback: (success, response) => {
        let url = `https://${AUTH0_CONFIG.domain}/continue?state=${self.options.auth0State}&enrolled=${self.options.userId}`;
        location.replace(url);
      }
    };

    this.voiceItInstance[nextStep](voiceItOptions);
  };

  this.start2FAProcess = function() {
    let self = this;
    return self.getToken().then(_ => self.verify());
  };
};