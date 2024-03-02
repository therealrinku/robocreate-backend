/*
Facebook API handler
  long lived access token docs: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/
  post docs: https://developers.facebook.com/docs/pages-api/posts/
  insight docs: https://developers.facebook.com/docs/platforminsights/page
*/

const { constants } = require("../helpers/constants");

// TODO => move this to seperate file later
const channelEndpointMap = {
  facebook: constants.fbGraphApiBaseUrl,
};

async function handleChannelApiCall({ method, endpoint, channel, bearerToken, body, queryParamString = "" }) {
  const baseUrl = channelEndpointMap[channel];

  if (!baseUrl) {
    throw new Error("Unsupported Channel");
  }

  const url = `${baseUrl}/${endpoint}?${queryParamString}`;

  const requestOptions = {
    method: method || "get",
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  if (bearerToken) {
    requestOptions.headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  const response = await fetch(url, requestOptions);
  return response;
}
// ==========================================================================

async function createPost(pageId, body, pageAccessToken) {
  if (!pageId || !body || !pageAccessToken) {
    throw new Error("Not enough info to create post");
  }

  const response = await handleChannelApiCall({
    endpoint: `${pageId}/feed`,
    bearerToken: pageAccessToken,
    channel: "facebook",
    method: "post",
    body: body,
  });

  const resp = await response.json();

  if (!resp.id) {
    throw new Error("Something went wrong while publishing the post.");
  }

  return resp.id;
}

async function getPagePosts(pageId, pageAccessToken) {
  if (!pageId || !pageAccessToken) {
    throw new Error("Not enough info to get page posts");
  }

  const response = await handleChannelApiCall({
    endpoint: `${pageId}/feed`,
    queryParamString: `fields=likes.summary(true),comments.summary(true),shares,full_picture,permalink_url,message,created_time`,
    bearerToken: pageAccessToken,
    channel: "facebook",
  });

  return await response.json();
}

async function getMe(shortLivedAccessToken) {
  if (!shortLivedAccessToken) {
    throw new Error("Invalid access token");
  }

  const response = await handleChannelApiCall({
    endpoint: `me`,
    queryParamString: `fields=id,name`,
    bearerToken: shortLivedAccessToken,
    channel: "facebook",
  });

  return await response.json();
}

async function getUserLongLivedAccessToken(shortLivedAccessToken) {
  if (!shortLivedAccessToken) {
    throw new Error("Invalid access token");
  }

  const response = await handleChannelApiCall({
    endpoint: `oauth/access_token`,
    queryParamString: `grant_type=fb_exchange_token&          
    client_id=${constants.fbAppId}&
    client_secret=${constants.fbAppSecret}&
    fb_exchange_token=${shortLivedAccessToken}`,
    channel: "facebook",
  });

  const longLivedAccessToken = (await response.json())?.access_token;

  if (!longLivedAccessToken) {
    throw new Error("Something went wrong, please try again later");
  }

  return longLivedAccessToken;
}

async function getFirstPage(userLongLivedAccessToken, appScopedUserId) {
  if (!userLongLivedAccessToken || !appScopedUserId) {
    throw new Error("Not enough data provided");
  }

  const response = await handleChannelApiCall({
    endpoint: `${appScopedUserId}/accounts`,
    queryParamString: `access_token=${userLongLivedAccessToken}`,
    channel: "facebook",
  });

  const jsonResponse = await response.json();

  if (jsonResponse.data?.length === 0) {
    throw new Error("Please provide the full access.");
  }

  // we just return the first found page here
  // i.e user can connect one fb page at a time
  const firstPage = jsonResponse.data[0];
  return firstPage;
}

async function getPageInsights(pageId, pageLongLivedAccessToken) {
  if (!pageId || !pageLongLivedAccessToken) {
    throw new Error("Not enough data provided");
  }

  const response = await handleChannelApiCall({
    endpoint: `${pageId}/insights`,
    queryParamString: `metric=page_post_engagements&period=day&date_preset=last_30d&access_token=${pageLongLivedAccessToken}`,
    channel: "facebook",
  });

  return await response.json();
}

const Fb = {
  createPost: createPost,
  getMe: getMe,
  getPagePosts: getPagePosts,
  getUserLongLivedAccessToken: getUserLongLivedAccessToken,
  getFirstPage: getFirstPage,
  getPageInsights: getPageInsights,
};

module.exports = { Fb };
