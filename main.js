const API_URL = "https://wt-13aebf4eeaa9913542725d4a90e4d49e-0.sandbox.auth0-extend.com/voiceit";
const PUBLIC_ENDPOINT = "/api/public";
const PRIVATE_ENDPOINT = "/api/private";

const headlineBtn = document.querySelector("#headline");
const secretBtn = document.querySelector("#secret");
const loginBtn = document.querySelector("#loginBtn");
const logoutBtn = document.querySelector("#logoutBtn");

headlineBtn.addEventListener("click", () => {
  fetcher(`${API_URL}${PUBLIC_ENDPOINT}`);
});

secretBtn.addEventListener("click", (event) => {
  fetcher(`${API_URL}${PRIVATE_ENDPOINT}/${auth.getUser()}`);
});

logoutBtn.addEventListener("click", (event) => {
  auth.logout();
  UIUpdate.loggedOut();
});

loginBtn.addEventListener("click", (event) => {
  auth.login();
});

//Set the initial cat (in case we're offline)
UIUpdate.updateCat(200);