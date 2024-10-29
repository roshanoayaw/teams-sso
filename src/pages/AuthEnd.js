import { app, authentication } from "@microsoft/teams-js";
import React, { useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Spinner } from "@fluentui/react-components";
import { ENDPOINTS } from "constants/appConstants";
import { trackException } from "utils/helper.utils";
import { toastDetails } from "constants/appConstants";
import { toast } from "react-toastify";
import { getToken } from "utils/helper.utils";
import { AUTHSTART } from "constants/appConstants";

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

function AuthEnd() {
  const { t } = useTranslation();

  useEffect(() => {
    app.initialize();
    localStorage.removeItem("auth.error");

    let hashParams = getHashParameters();

    // setStateauthtoken(access_token);

    if (hashParams["error"]) {
      // Authentication/authorization failed
      console.log("sso failed 38", hashParams);

      localStorage.setItem("auth.error", JSON.stringify(hashParams));
      authentication.notifyFailure(hashParams["error"]);
    } else if (hashParams["access_token"]) {
      const access_token = hashParams?.access_token;
      console.log("hash params", hashParams);
      localStorage.setItem("consent_access_token", JSON.stringify(hashParams));

      const url = `${ENDPOINTS.AUTHSTART_URL}${ENDPOINTS.AUTHSTART_ACCESS_TOKEN_API}?ssotoken=${access_token}&appId=${ENDPOINTS.GLOBAL_APP_ID}&pId=5AD6CF77-B8F0-4499-A60F-E53B62472732`;

      const headers = {
        "Content-Type": "application/json",
      };
      console.log("sso failed 50 url", url);
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
          trackException(error, {
            email: localStorage.getItem("currentEmail"),
            token: getToken(),
            error,
          });
          console.log("requestConsent error", error);
          // toast.error(t("SomethingWrong"), {
          //   ...toastDetails,
          //   className: "toast-error",
          // });
          authentication.notifyFailure(errorData);
        });
    } else {
      localStorage.setItem("auth.error", JSON.stringify(hashParams));
      console.log("sso failed 76", hashParams);

      authentication.notifyFailure("UnexpectedFailure");
    }
  }, []);

  return (
    <div
      style={{ minHeight: "100vh" }}
      className="d-flex justify-content-center align-item-center"
    >
      <Spinner
        size="small"
        label={"Configuring your account..."}
        labelPosition="below"
      />
    </div>
  );
}

export default AuthEnd;
