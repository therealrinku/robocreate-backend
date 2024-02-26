const { constants } = require("./constants");

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

module.exports = { handleChannelApiCall };
