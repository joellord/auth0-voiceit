let UIUpdate = {};
const HTTP_CAT_URL = "http://http.cat";

UIUpdate.loggedIn = function(tokens) {
  loginBtn.classList.add("d-none");
  logoutBtn.classList.remove("d-none");
};

UIUpdate.loggedOut = function() {
  loginBtn.classList.remove("d-none");
  logoutBtn.classList.add("d-none");
  UIUpdate.alertBox("Logged Out");
};

UIUpdate.routeChange = function() {
  if (document.querySelector(".navbar-nav li.active")) {
    document.querySelector(".navbar-nav li.active").classList.remove("active");
  }
  document.querySelector(".navbar [data-route='#" + window.location.hash.replace("#", "") + "']").classList.add("active");
};

UIUpdate.updateCat = function(status) {
  const httpCat = document.querySelector("#httpcat");
  httpCat.src = `${HTTP_CAT_URL}/${status}`;
};

UIUpdate.alertBox = function(message) {
  const alertBox = document.querySelector(".alert");
  alertBox.innerHTML = message;
};

window.addEventListener("hashchange", UIUpdate.routeChange);