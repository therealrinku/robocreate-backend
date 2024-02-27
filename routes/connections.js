const { db } = require("../database/db");
const { verifyJWT } = require("../middlewares/verifyJWT");
const router = require("express").Router();
const { Fb } = require("../channels/fb");

router.post("/createPost", verifyJWT, async function (req, res) {
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
      await Fb.createPost(pageId, req.body, pageAccessToken);
      res.status(200).send({ success: true });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.delete("/removeConnection", verifyJWT, async function (req, res) {
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
});

router.get("/getLatestPosts", verifyJWT, async function (req, res) {
  try {
    const { connectionId, page = 1 } = req.query;

    const connectionInfo = await db.query(`select * from connections where id='${connectionId}'`);

    if (connectionInfo.rowCount < 1) {
      throw new Error("Connection wasn't found.");
    }

    const { connection_type: connectionType, access_token: pageAccessToken, page_id: pageId } = connectionInfo.rows[0];

    //add for more later ✨
    if (connectionType === "facebook") {
      if (!pageId || !pageAccessToken) {
        res.status(200).send({ success: true, posts: [] });
        return;
      }

      const pagePosts = await Fb.getPagePosts(pageId, pageAccessToken);
      res.status(200).send({ success: true, posts: pagePosts });
      return;
    }

    res.status(200).send({ success: true, posts: [] });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post("/addConnection", verifyJWT, async function (req, res) {
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
      const { id: appScopedUserId } = await Fb.getMe(token);
      // STEP 2 => get user's long lived access token
      const userLongLivedAccessToken = await Fb.getUserLongLivedAccessToken(token);
      // STEP 3 => get the first page's long lived access token
      const firstPage = await Fb.getFirstPage(userLongLivedAccessToken, appScopedUserId);

      const { access_token: pageAccessToken, id: pageId, name: pageName } = firstPage;

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
});

module.exports = router;
