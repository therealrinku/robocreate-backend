const { db } = require("../database/db");
const { verifyJWT } = require("../middlewares/verifyJWT");

const router = require("express").Router();

const { Fb } = require("../externals/fb");

router.delete("/removeConnection", verifyJWT, async function (req, res) {
  try {
    const { connectionFor } = req.body;
    const userEmail = req.authUserEmail;

    if (!connectionFor) {
      throw new Error("connectionFor and token are required in the body.");
    }
    if (connectionFor !== "facebook") {
      throw new Error("unsupported connectionFor value, only supported value is 'facebook'.");
    }

    const response = await db.query(`select * from users where email='${userEmail}'`);

    //save token to the connections table
    const userId = response.rows[0].id;

    if (connectionFor === "facebook") {
      //delete fb connection, meaning make connections string null  for now,
      //ofc needs update once we support multiple platforms
      db.query(`update users set connections='${null}' where id='${userId}'`);

      //remove channels from channels db
      db.query(`delete from channels where user_id='${userId}' and connection_type='facebook'`);
    }

    res.status(200).send({ success: true });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.get("/getLatestPosts", verifyJWT, async function (req, res) {
  try {
    //per page => 10 for now
    const { connectionFor, page = 1 } = req.query;

    const userEmail = req.authUserEmail;

    const response = await db.query(`select * from users where email='${userEmail}'`);

    const userId = response.rows[0].id;

    //add for more later ✨
    if (connectionFor === "facebook") {
      ///get fb posts
      //TODO: ENCAPSULATE THIS IN fb.js
      const resp = await db.query(`select fb_access_token from connections where user_id = '${userId}'`);
      const fb_access_token = resp.rows[0].fb_access_token;
      const fbResp = await (
        await fetch(`${process.env.FB_GRAPH_API_BASE_URL}/me?access_token=${fb_access_token}&fields=id,accounts`)
      ).json();

      const pgAccessToken = fbResp.accounts.data[0].access_token;
      const pgId = fbResp.accounts.data[0].id;

      const postsResp = await (
        await fetch(
          `${process.env.FB_GRAPH_API_BASE_URL}/${pgId}/feed?fields=likes,comments.limit(10),shares,full_picture,permalink_url`,
          {
            headers: {
              Authorization: `Bearer ${pgAccessToken}`,
            },
          }
        )
      ).json();

      res.status(200).send({ success: true, posts: postsResp });
      return;
    }

    res.status(200).send({ success: true });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post("/addConnection", verifyJWT, async function (req, res) {
  try {
    const { connectionFor, token } = req.body;
    const userEmail = req.authUserEmail;

    if (!connectionFor || !token) {
      throw new Error("connectionFor and token are required in the body.");
    }
    if (connectionFor !== "facebook") {
      throw new Error("unsupported connectionFor value, only supported value is 'facebook'.");
    }

    const response = await db.query(`select * from users where email='${userEmail}'`);

    const userId = response.rows[0].id;

    //supports fb only for now
    //1 fb page :( minimal support >:<
    //add for more later ✨
    if (connectionFor === "facebook") {
      await db.query(`update users set connections='facebook' where id='${userId}'`);

      // STEP 1 => get app scoped user id aka user id
      const { id: appScopedUserId } = await Fb.getMe(token);
      // STEP 2 => get user's long lived access token
      const userLongLivedAccessToken = await Fb.getUserLongLivedAccessToken(token);
      // STEP 3 => get the first page's long lived access token
      // Support for multiple pages coming soon ✨
      const firstPage = await Fb.getFirstPage(userLongLivedAccessToken, appScopedUserId);

      const { access_token: pageAccessToken, id: pageId, name: pageName } = firstPage;

      await db.query(
        `insert into connections(user_id,connection_type, page_name,page_id, access_token) values('${userId}', 'facebook','${pageName}', '${pageId}', '${pageAccessToken}')`
      );
    }

    res.status(200).send({ success: true });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
