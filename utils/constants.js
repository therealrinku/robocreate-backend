const constants = {
  fbGraphApiBaseUrl: process.env.FB_GRAPH_API_BASE_URL,
  fbAppSecret: process.env.FB_APP_SECRET,
  fbAppId: process.env.FB_APP_ID,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  jwtExpiry: "2d",
};

module.exports = { constants };
