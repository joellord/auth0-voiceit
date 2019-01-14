// Needs to be created in the repo
const AUTH0_CONFIG = {
  domain: "TENANT.auth0.com",
  clientID: "AUTH0 CLIENT ID",
  audience: "AUDIENCE (API IDENTIFIER)",
  responseType: "token id_token",
  scope: "openid profile",
  redirectUri: window.location.origin
};