import React, { useEffect, useState } from "react";
import { app, authentication } from "@microsoft/teams-js";
import { useNavigate } from "react-router-dom";
import { ENDPOINTS, AUTHSTART } from "constants/appConstants";
import { handleVerify } from "../authend/helpers";
import { styles } from "styles/styles";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { LOCALSTORAGE_CONSTANTS } from "constants/appConstants";
import { sendMessageToTeleBot } from "./helper";

const AuthStart = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responseData, setResponseData] = useState(null);
  const [stateAccessToken, setstateAccessToken] = useState();

  const { loaderContainer } = styles;
  const parent = localStorage.getItem("parent");

  const initializeSSO = async () => {
    app.initialize().then(() => {
      getClientSideToken();
    });
    // authentication
    //   .getAuthToken({
    //     resources: `api://auth.get1page.com/${AUTHSTART.resourceId}`,
    //     silent: false,
    //   })
    //   .then((token) => {
    //     app.notifySuccess(token);
    //   })
    //   .catch((message) => {
    //     app.notifyFailure({
    //       reason: app.FailedReason.AuthFailed,
    //       message,
    //     });
    //   });
    // Get the tab context, and use the information to navigate to Azure AD login page
    // app.getContext(function (context) {
    //   // Generate random state string and store it, so we can verify it in the callback
    //   let state = newGuid();
    //   localStorage.setItem("auth.state", state);
    //   localStorage.removeItem("auth.error");
    //   // See https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-v2-protocols-implicit
    //   // for documentation on these query parameters
    //   let queryParams = {
    //     client_id: AUTHSTART.resourceId,
    //     response_type: "id_token token",
    //     response_mode: "fragment",
    //     scope:
    //       "https://graph.microsoft.com/User.Read email openid profile offline_access",
    //     redirect_uri: window.location.origin + "/auth-end",
    //     nonce: newGuid(),
    //     state: state,
    //     login_hint: context.loginHint,
    //   };
    //   // Go to the AzureAD authorization endpoint (tenant-specific endpoint, not "common")
    //   // For guest users, we want an access token for the tenant we are currently in, not the home tenant of the guest.
    //   let authorizeEndpoint = `https://login.microsoftonline.com/${
    //     context.tid
    //   }/oauth2/v2.0/authorize?${toQueryString(queryParams)}`;
    //   window.location.assign(authorizeEndpoint);
    // });
  };

  function getClientSideToken() {
    return new Promise(() => {
      console.log("1. Get auth token from Microsoft Teams, authstart");
      authentication
        .getAuthToken({})
        .then((token) => {
          console.log("authstart 111", token);

          app.getContext().then((res) => {
            const tid = res.user.tenant.id;
            console.log("authstart refresh token", res);
            getToken(token, tid);
          });
        })
        .catch((error) => {
          console.log("authstart 120", error);
        });
    });
  }

  function requestConsent() {
    const authParams = {
      url: window.location.origin + "/auth-login",
      width: 600,
      height: 535,
    };
    console.log("requestConsent before");
    return authentication
      .authenticate(authParams)
      .then(async (data) => {
        console.log("requestConsent after", data);
        const responseData = JSON.parse(data).data;
        console.log("requestConsent after res", responseData);

        localStorage.setItem(
          LOCALSTORAGE_CONSTANTS.AUTH_TOKEN,
          responseData.tokenId
        );

        localStorage.setItem(
          LOCALSTORAGE_CONSTANTS.TEAMS_REDIRECT,
          responseData.redirectUrl
        );

        localStorage.setItem(
          LOCALSTORAGE_CONSTANTS.TEAMS_TOKEN,
          responseData.tokenId
        );

        const language = localStorage.getItem(LOCALSTORAGE_CONSTANTS.S_LANG);

        // window.location.assign(
        //   `${responseData.redirectUrl}${PATHS.verify}?data=${JSON.stringify(
        //     responseData
        //   )}&authtoken=${responseData.tokenId}&language=${language}`
        // );
        // }
      })
      .catch((error) => {
        sendMessageToTeleBot(error);
        console.log("requestConsent Error__", error);
        // alert(`error message ${JSON.stringify(error)}`);
        const failedToOpen = "Error: FailedToOpenWindow";
        const cancelled = "Error: CancelledByUser";
        const consentReq = "Error: consent_required";
        const serverError = "Error: server_error";
        const isCancelled =
          cancelled.toLowerCase() === error.toString().toLowerCase();
        const consentIsRequired =
          consentReq.toLowerCase() === error.toString().toLowerCase();
        const isServerError =
          serverError.toLowerCase() === error.toString().toLowerCase();
        const isFailedToOpen =
          failedToOpen.toLowerCase() === error.toString().toLowerCase();
        console.log(
          "requestConsent Error__ 12",

          error.toString().toLowerCase(),
          isCancelled,
          consentIsRequired
        );
        // if (isCancelled || consentIsRequired) {
        //   requestConsent();
        //   return;
        // }
        // if (isServerError) {
        //   navigate(PATHS.workingMail);
        //   return;
        // } else if (isFailedToOpen || error) {
        //   navigate(`${PATHS.workingMail}?message=no-popup`);
        // }
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

      console.log("authstart 190 refresh token", response.data); // This will contain the token information
      const accessToken = response?.data?.access_token;
      setstateAccessToken(accessToken);
      if (accessToken) {
        Checkuser(accessToken);
      }
    } catch (error) {
      console.error("authstart Error while getting the token:", error);
      if (error.response.data.error === "invalid_client") {
        requestConsent();
      }
    }
  };

  const Checkuser = (accessToken) => {
    const url = `${ENDPOINTS.AUTHSTART_URL}${ENDPOINTS.AUTHSTART_ACCESS_TOKEN_API}?ssotoken=${accessToken}`;

    const headers = {
      "Content-Type": "application/json",
    };

    axios
      .post(url, { headers })
      .then((response) => {
        setResponseData(response.data);
        setLoading(false);
        setError(null); // Clear the error in case of a retry
        if (response?.data) {
          handleVerify(response?.data);
        }
      })
      .catch((error) => {
        // Handle errors here
        console.error("userdataerror", error);
        setError("An error occurred while fetching the data.");
        setLoading(false);
      });
  };

  useEffect(() => {
    initializeSSO();
  }, []);

  return (
    <>
      <div>
        {loading ? (
          // Show loader while waiting for the response
          <div className="flex-column" style={loaderContainer}>
            <p>Loading</p>
            <p style={{ font: "1rem", fontWeight: "500", marginTop: "1rem" }}>
              {t("TeamsPopUpMsg")}
            </p>
          </div>
        ) : error ? (
          // Show error message and retry button
          <div>
            <p>{error}</p>
            <button onClick={() => Checkuser(stateAccessToken)}>Retry</button>
          </div>
        ) : responseData ? (
          // Show content once the response is received
          <div>{/* Render your content based on the responseData */}</div>
        ) : (
          // Handle the case when responseData is null (initial state)
          <div>No data available.</div>
        )}
      </div>
    </>
  );
};

export default AuthStart;
