// =================================================================================
// =================== HANDLE EVERYTHING FACEBOOK HERE =============================
// =================================================================================

// DOCS FOR LONG LIVED ACCESS TOKEN: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/

const { FB_GRAPH_API_BASE_URL: fbGraphApiBaseUrl, FB_APP_SECRET: fbAppSecret } = process.env;

async function getMe(shortLivedAccessToken) {
  if (!shortLivedAccessToken) {
    throw new Error("Invalid access token");
  }

  const meResp = await fetch(`${fbGraphApiBaseUrl}/me?fields=id,name`, {
    headers: {
      Authorization: `Bearer ${shortLivedAccessToken}`,
    },
  });
  const meRespJson = await meResp.json();
  return meRespJson;
}

async function getUserLongLivedAccessToken(shortLivedAccessToken) {
  if (!shortLivedAccessToken) {
    throw new Error("Invalid access token");
  }

  const userLongLivedAccessTokenResp = await fetch(`${fbGraphApiBaseUrl}/oauth/access_token?  
          grant_type=fb_exchange_token&          
          client_id=881256046505003&
          client_secret=${fbAppSecret}&
          fb_exchange_token=${shortLivedAccessToken}`);

  const longLivedAccessToken = (await userLongLivedAccessTokenResp.json()).access_token;
  return longLivedAccessToken;
}

async function getFirstPage(userLongLivedAccessToken, appScopedUserId) {
  if (!userLongLivedAccessToken || !appScopedUserId) {
    throw new Error("Not enough data provided");
  }

  const resp = await fetch(`${fbGraphApiBaseUrl}/${appScopedUserId}/accounts?
  access_token=${userLongLivedAccessToken}`);

  // supports one page only for now >><<<
  // multi pages support coming soon
  const jsonResp = await resp.json();

  if (jsonResp.data.length === 0) {
    throw new Error("Please provide at full page access.");
  }

  const firstPage = jsonResp.data[0];
  return firstPage;
}

const Fb = {
  getMe: getMe,
  getUserLongLivedAccessToken: getUserLongLivedAccessToken,
  getFirstPage: getFirstPage,
};

module.exports = { Fb };
