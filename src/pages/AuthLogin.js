// auth-start.js
import { AUTHSTART } from "constants/appConstants";
import queryString from "query-string";
import { v4 as uuidv4 } from "uuid";
import { app } from "@microsoft/teams-js";

const clientId = AUTHSTART.clientId;
const redirectUri = `${AUTHSTART.redirectUri}/auth-end`;

export default function AuthLogin() {
  app
    .initialize()
    .then(() => {
      app.getContext().then((context) => {
        // Generate random state string and store it, so we can verify it in the callback
        // let state = _guid(); // _guid() is a helper function in the sample
        const state = uuidv4();
        const nonce = uuidv4();
        localStorage.setItem("authState", state);

        localStorage.setItem("simple.state", state);
        localStorage.removeItem("simple.error");

        // Go to the Azure AD authorization endpoint
        let params = {
          client_id: clientId,
          response_type: "id_token token",
          response_mode: "fragment",
          scope:
            "https://graph.microsoft.com/User.Read email openid profile offline_access",
          redirect_uri: redirectUri,
          nonce: nonce,
          state: state,
          // The context object is populated by Teams; the loginHint attribute
          // is used as hinting information
          login_hint: context.user.loginHint,
        };
        const queryParams = queryString.stringify(params);
        const authorizeUrl = `https://login.microsoftonline.com/${context.user.tenant.id}/oauth2/v2.0/authorize?${queryParams}&prompt=consent`;
        // let authorizeEndpoint = `https://login.microsoftonline.com/${
        //   context.user.tenant.id
        // }/oauth2/v2.0/authorize?${toQueryString(queryParams)}`;
        window.location.assign(authorizeUrl);
      });
    })
    .catch((error) => {
      console.log("requestConsent authend", error);
    });
}
