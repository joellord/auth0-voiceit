const ENDPOINT = "https://wt-13aebf4eeaa9913542725d4a90e4d49e-0.sandbox.auth0-extend.com/voiceit/voiceit_endpoint";
const TOKEN = "https://wt-13aebf4eeaa9913542725d4a90e4d49e-0.sandbox.auth0-extend.com/voiceit/voiceit_token";
const AUTH0_URL = "https://auth0-voiceit.auth0.com";

let VoiceItHelper = function(options) {
  this.MODES = {
    VIDEO: "video",
    FACE: "face"
  };
  this.options = options;
  this.voiceItInstance = new VoiceIt2.initialize(ENDPOINT, "./vendor/face_detector.wasm");
  this.mode = this.options.mode || this.MODES.FACE;
  this.enroll = this.options.userId ? false : true;

  this.getToken = function() {
    let url = `${TOKEN}`;
    let self = this;
    url += this.enroll ? "" : `?userId=${this.options.userId}`;
    return fetch(url).then(resp => resp.json()).then(data => {
      self.voiceItInstance.setSecureToken(data.Token);
      if (this.enroll) {
        self.options.userId = data.userId;
      }
    });
  };

  this.verify = function() {
    let self = this;
    let nextStep = "";
    if (this.enroll && this.mode === this.MODES.VIDEO) nextStep = "encapsulatedVideoEnrollment";
    if (this.enroll && this.mode === this.MODES.FACE) nextStep = "encapsulatedFaceEnrollment";
    if (!this.enroll && this.mode === this.MODES.VIDEO) nextStep = "encapsulatedVideoVerification";
    if (!this.enroll && this.mode === this.MODES.FACE) nextStep = "encapsulatedFaceVerification";

    let voiceItOptions = {
      doLiveness: !this.options.skipLivenessCheck,
      phrase: (this.mode === this.MODES.VIDEO) ? "never forget tomorrow is a new day" : undefined,
      contentLanguage: (this.mode === this.MODES.VIDEO) ? "en-US" : "",
      completionCallback: (success, response) => {
        let url = `${AUTH0_URL}/continue?state=${self.options.auth0State}&`;
        url += (self.enroll) ? `enrolled=${self.options.userId}` : `token=${response.token}`;
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
