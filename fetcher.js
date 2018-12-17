const fetcher = (url) => {
  let accessToken = auth.tokens.ACCESS_TOKEN;
  let fetchOpt = {};

  fetchOpt.headers = (accessToken) ? {"Authorization": "Bearer " + accessToken} : {};

  return fetch(url, fetchOpt)
      .then(resp => {
        UIUpdate.updateCat(resp.status);
        return resp.text();
      }).then(body => {
        UIUpdate.alertBox(body);
        return body;
      });
};
