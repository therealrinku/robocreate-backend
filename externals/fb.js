// =================================================================================
// =================== HANDLE EVERYTHING FACEBOOK HERE =============================
// =================================================================================

const { FB_GRAPH_API_BASE_URL: fbGraphApiBaseUrl, FB_APP_SECRET: fbAppSecret } = process.env;

async function getUserLongLivedAccessToken(shortLivedAccessToken) {
  if (!shortLivedAccessToken) {
    throw new Error("Invalid access token");
  }

  const userLongLivedAccessTokenResp = await fetch(`${fbGraphApiBaseUrl}/oauth/access_token?  
          grant_type=fb_exchange_token&          
          client_id=358037620373561&
          client_secret=${fbAppSecret}&
          fb_exchange_token=${shortLivedAccessToken}`);

  const longLivedAccessToken = await userLongLivedAccessTokenResp.json().access_token;
  return longLivedAccessToken;
}

async function getPagesLongLivedAccessToken(userLongLivedAccessToken) {
  if (!userLongLivedAccessToken) {
    throw new Error("No user access token provided");
  }

  const pagesLongLivedAccessToken = await fetch(`${fbGraphApiBaseUrl}/358037620373561/accounts?
  access_token=${userLongLivedAccessToken}`);

  // supports one page only for now >><<<
  // multi pages support coming soon
  const pageLongLivedAccessToken = (await pagesLongLivedAccessToken.json()).data[0]?.access_token;
  return pageLongLivedAccessToken;
}

const Fb = {};

Fb.getUserLongLivedAccessToken = getUserLongLivedAccessToken;
Fb.getPagesLongLivedAccessToken = getPagesLongLivedAccessToken;

module.exports = { Fb };
