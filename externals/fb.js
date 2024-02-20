// =================================================================================
// =================== HANDLE EVERYTHING FACEBOOK HERE =============================
// =================================================================================

// DOCS FOR LONG LIVED ACCESS TOKEN: https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived/

const { FB_GRAPH_API_BASE_URL: fbGraphApiBaseUrl, FB_APP_SECRET: fbAppSecret } = process.env;

async function createPost(pageId, body, pageAccessToken) {
  if (!pageId || !body || !pageAccessToken) {
    throw new Error("Not enough info to create post");
  }

  const responseJson = await (
    await fetch(
      `${fbGraphApiBaseUrl}/${pageId}/feed?fields=likes,comments.limit(10),shares,full_picture,permalink_url`,
      {
        method: "post",
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
          "Content-Type": "application/json",
        },
        //https://developers.facebook.com/docs/pages-api/posts/
        // expected body =>  {
        //   "message":"your_message_text",
        //   "link":"your_url",
        //   "published":"false",
        //   "scheduled_publish_time":"unix_time_stamp_of_a_future_date",
        // }
        body: JSON.stringify(body),
      }
    )
  ).json();

  return responseJson;
}

async function getPagePosts(pageId, pageAccessToken) {
  if (!pageId || !pageAccessToken) {
    throw new Error("Not enough info to get page posts");
  }

  const postsRespJson = await (
    await fetch(
      `${fbGraphApiBaseUrl}/${pageId}/feed?fields=likes,comments.limit(10),shares,full_picture,permalink_url`,
      {
        headers: {
          Authorization: `Bearer ${pageAccessToken}`,
        },
      }
    )
  ).json();

  return postsRespJson;
}

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
  createPost: createPost,
  getMe: getMe,
  getPagePosts: getPagePosts,
  getUserLongLivedAccessToken: getUserLongLivedAccessToken,
  getFirstPage: getFirstPage,
};

module.exports = { Fb };
