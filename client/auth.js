// Connection details for Auth0 - Copy & pasted from the quick start
let webAuth = new auth0.WebAuth(AUTH0_CONFIG);

let auth = {};
auth.tokens = {
  ACCESS_TOKEN: "",
  ID_TOKEN: "",
  ID_TOKEN_PAYLOAD: {}
};

auth.login = () => {
  return webAuth.authorize();
};

auth.logout = () => {
  auth.tokens.ACCESS_TOKEN = "";
  auth.tokens.ID_TOKEN = "";
  setTimeout(() => webAuth.logout({
    returnTo: AUTH0_CONFIG.redirectUri,
    clientID: AUTH0_CONFIG.clientID
  }), 0);
};

// TODO Also check for expiry
auth.isLoggedIn = () => {
  return !!auth.tokens.ACCESS_TOKEN;
};


// Parses the hash info on redirect and extracts the
auth.parseHash = () => {
  webAuth.parseHash((err, authResult) => {
    if (err) {
      console.error(err);
      UIUpdate.alertBox(`${err.errorDescription}`);
    } else if (authResult && authResult.accessToken && authResult.idToken) {
      window.location.hash = '';
      auth.tokens.ACCESS_TOKEN = authResult.accessToken;
      auth.tokens.ID_TOKEN = authResult.idToken;
      auth.tokens.ID_TOKEN_PAYLOAD = authResult.idTokenPayload;
      UIUpdate.loggedIn();
      UIUpdate.alertBox(`Logged in<br>Access Token: ${auth.tokens.ACCESS_TOKEN}<br>ID Token: ${auth.tokens.ID_TOKEN}`);
    }
  });
};

// Check for the user name in the ID token
auth.getUser = () => {
  return auth.tokens.ID_TOKEN_PAYLOAD.name || "";
}

window.addEventListener("DOMContentLoaded", auth.parseHash);