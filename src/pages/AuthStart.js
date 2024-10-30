import React, { useEffect } from "react";
import { app, authentication } from "@microsoft/teams-js";
import axios from "axios";
import { AUTHSTART } from "../constants/appConstants";

const AuthStart = () => {
  const initializeSSO = () => {
    app
      .initialize()
      .then(() => {
        getClientSideToken();
      })
      .catch((error) => {});
  };

  function getClientSideToken() {
    return new Promise(() => {
      authentication
        .getAuthToken({})
        .then((token) => {
          app.getContext().then((res) => {
            const tid = res.user.tenant.id;
            getToken(token, tid);
          });
        })
        .catch((error) => {
          console.log("Error getting token: ", error);
        });
    });
  }

  function requestConsent() {
    const authParams = {
      url: window.location.origin + "/auth-login",
      width: 600,
      height: 535,
    };
    return authentication
      .authenticate(authParams)
      .then(async (data) => {
        console.log("requestConsent after res", data);
        // navigate to where you want to go with this data
      })
      .catch((error) => {
        console.log("requestConsent Error__", error);
      });
  }

  const getToken = async (token) => {
    const url = `https://cros-anywhere-proxy.onrender.com/https://login.microsoftonline.com/4a3aa8a7-f290-4430-9b1e-349a6b351692/oauth2/v2.0/token`;
    const data = new URLSearchParams();
    data.append("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer");
    data.append("client_id", AUTHSTART.clientId);
    data.append("client_secret", AUTHSTART.clientSecret);
    data.append("assertion", token);
    data.append("scope", "https://graph.microsoft.com/User.Read");
    data.append("requested_token_use", "on_behalf_of");

    try {
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const accessToken = response?.data?.access_token;
      if (accessToken) {
        Checkuser(accessToken);
      }
    } catch (error) {
      console.error("authstart Error while getting the token:", error);
      requestConsent();
    }
  };

  const Checkuser = (accessToken) => {
    const url = `api-url-which-returns-token-and-other-data-and-pass-this-${accessToken}`;

    const headers = {
      "Content-Type": "application/json",
    };

    axios
      .post(url, { headers })
      .then((response) => {
        if (response?.data) {
          // handleVerify(response?.data);
        }
      })
      .catch((error) => {
        // Handle errors here
        console.error("userdataerror", error);
      });
  };

  useEffect(() => {
    initializeSSO();
  }, []);

  return (
    <>
      <div>{/* content depending on your requirement */}</div>
    </>
  );
};

export default AuthStart;
