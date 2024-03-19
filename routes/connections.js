const { db } = require("../database/db");
const { constants } = require("../helpers/constants");
const { verifyJWT } = require("../middlewares/verifyJWT");
const router = require("express").Router();
const { FB } = require("socials.js");
const { redis } = require("../redis/redis");

async function createPost(req, res) {
  try {
    const { connectionId } = req.query;
    const reqUser = req.user;

    if (!req.body) {
      throw new Error("request body is required.");
    }

    const connectionInfo = await db.query(
      `select * from connections where id='${connectionId}' and user_id='${reqUser.id}'`
    );

    if (connectionInfo.rowCount < 1) {
      throw new Error("Connection not found.");
    }

    const { connection_type: connectionType, access_token: pageAccessToken, page_id: pageId } = connectionInfo.rows[0];

    if (connectionType === "facebook") {
      await FB.createPost(pageId, pageAccessToken, req.body);
      res.status(200).send({ success: true });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}

async function removeConnection(req, res) {
  try {
    const { connectionId } = req.query;
    const reqUser = req.user;

    if (!connectionId) {
      throw new Error("connectionId is required in the params.");
    }

    await db.query(`delete from connections where id='${connectionId}' and user_id = '${reqUser.id}'`);
    res.status(200).send({ success: true });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}

async function getLatestPosts(req, res) {
  try {
    const { connectionId, page = 1 } = req.query;
    const reqUser = req.user;

    const connectionInfo = await db.query(
      `select * from connections where id='${connectionId}' and user_id = '${reqUser.id}'`
    );

    if (connectionInfo.rowCount < 1) {
      throw new Error("Connection wasn't found.");
    }

    const { connection_type: connectionType, access_token: pageAccessToken, page_id: pageId } = connectionInfo.rows[0];

    //add for more later ✨
    if (connectionType === "facebook") {
      if (!pageId || !pageAccessToken) {
        res.status(200).send({ success: true, posts: { data: [], paging: {} } });
        return;
      }

      const pagePosts = await FB.getPagePosts(pageId, pageAccessToken);
      // pagePosts response format => { data: [], paging: {} }
      res.status(200).send({ success: true, posts: pagePosts });
      return;
    }

    res.status(200).send({ success: true, posts: { data: [], paging: {} } });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}

async function getPageInsights(req, res) {
  try {
    const { connectionId } = req.query;
    const reqUser = req.user;

    const connectionInfo = await db.query(
      `select * from connections where id='${connectionId}' and user_id = '${reqUser.id}'`
    );

    if (connectionInfo.rowCount < 1) {
      throw new Error("Connection wasn't found.");
    }

    const { connection_type: connectionType, access_token: pageAccessToken, page_id: pageId } = connectionInfo.rows[0];

    //add for more later ✨
    if (connectionType === "facebook") {
      if (!pageId || !pageAccessToken) {
        return res.status(200).send({ success: true, data: {} });
      }

      // check if redis has it before hitting fb endpoint
      // if cache hits return cached insights
      const redisKey = `insights-${connectionType}-${pageId}`;
      const cachedInsights = await redis.get(redisKey);

      if (cachedInsights) {
        return res.status(200).send({ success: true, data: JSON.parse(cachedInsights) });
      }

      const insightsResp = await FB.getPageInsights(pageId, pageAccessToken);

      // save to redis, EXPIRES IN A DAY
      await redis.set(redisKey, JSON.stringify(insightsResp), { EX: 86400 });

      return res.status(200).send({ success: true, data: insightsResp });
    }

    res.status(200).send({ success: true, data: {} });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}

async function addConnection(req, res) {
  try {
    const { connectionFor, token } = req.body;
    const reqUser = req.user;

    if (!connectionFor || !token) {
      throw new Error("connectionFor and token are required in the body.");
    }
    if (connectionFor !== "facebook") {
      throw new Error("unsupported connectionFor value, only supported value is 'facebook'.");
    }

    //supports connecting only one fb page at a time
    if (connectionFor === "facebook") {
      // STEP 1 => get app scoped user id aka user id
      const { id: appScopedUserId } = await FB.getMe(token);
      // STEP 2 => get user's long lived access token
      FB.setFbAppId(constants.fbAppId);
      FB.setFbAppSecret(constants.fbAppSecret);
      const userLongLivedAccessToken = await FB.getUserLongLivedAccessToken(token);
      // STEP 3 => get the first page's long lived access token
      const pages = await FB.getAllPages(userLongLivedAccessToken, appScopedUserId);
      const { access_token: pageAccessToken, id: pageId, name: pageName } = pages[0];

      const resp = await db.query(
        `insert into connections(user_id,connection_type, page_name,page_id, access_token) values('${reqUser.id}', 'facebook','${pageName}', '${pageId}', '${pageAccessToken}') returning id`
      );

      res.status(200).send({
        success: true,
        connectionDetail: { connection_type: "facebook", id: resp.rows[0].id, page_id: pageId, page_name: pageName },
      });

      return;
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}

router.post("/createPost", verifyJWT, createPost);
router.delete("/removeConnection", verifyJWT, removeConnection);
router.get("/getLatestPosts", verifyJWT, getLatestPosts);
router.get("/getPageInsights", verifyJWT, getPageInsights);
router.post("/addConnection", verifyJWT, addConnection);

module.exports = router;
