import { app, authentication } from "@microsoft/teams-js";
import React, { useEffect } from "react";
import axios from "axios";

function getHashParameters() {
  let hashParams = {};

  window.location.hash
    .substring(1)
    .split("&")
    .forEach(function (item) {
      let s = item.split("="),
        k = s[0],
        v = s[1] && decodeURIComponent(s[1]);
      hashParams[k] = v;
    });
  return hashParams;
}

function AuthEndTest() {
  useEffect(() => {
    app.initialize();
    localStorage.removeItem("auth.error");

    let hashParams = getHashParameters();

    if (hashParams["error"]) {
      localStorage.setItem("auth.error", JSON.stringify(hashParams));
      authentication.notifyFailure(hashParams["error"]);
    } else if (hashParams["access_token"]) {
      const access_token = hashParams?.access_token;
      localStorage.setItem("consent_access_token", JSON.stringify(hashParams));

      const url = `api-url-which-returns-token-and-other-data-and-pass-this-${access_token}`;
      const headers = {
        "Content-Type": "application/json",
      };

      axios
        .post(url, { headers })
        .then(async (response) => {
          let key = "auth_result";
          localStorage.setItem(key, hashParams.access_token);
          const result = JSON.stringify({
            key,
            data: response.data,
            access_token: hashParams.access_token,
          });
          authentication.notifySuccess(result);
        })
        .catch(async (error) => {
          // Handle errors here
          const errorData = JSON.stringify(error);
          authentication.notifyFailure(errorData);
        });
    } else {
      localStorage.setItem("auth.error", JSON.stringify(hashParams));
      authentication.notifyFailure("UnexpectedFailure");
    }
  }, []);

  return (
    <div
      style={{ minHeight: "100vh" }}
      className="d-flex justify-content-center align-item-center"
    >
      <p>loading</p>
    </div>
  );
}

export default AuthEndTest;
