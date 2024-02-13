const { db } = require("../database/db");
const { verifyJWT } = require("../middlewares/verifyJWT");

const router = require("express").Router();

router.get("/getLatestPosts", verifyJWT, async function (req, res) {
  try {
    //per page => 10 for now
    const { connectionFor, page = 1 } = req.query;

    const userEmail = req.authUserEmail;

    const response = await db.query(`select * from users where email='${userEmail}'`);

    //save token to the connections table
    const userId = response.rows[0].id;

    //add for more later ✨
    if (connectionFor === "facebook") {
      ///get fb posts
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
      return
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

    const response = await db.query(`select * from users where email='${userEmail}'`);

    //save token to the connections table
    const userId = response.rows[0].id;

    //add for more later ✨
    if (connectionFor === "facebook") {
      await db.query(`update users set connections='facebook' where id='${userId}'`);
      await db.query(`insert into connections(user_id,fb_access_token) values('${userId}','${token}')`);
    }

    res.status(200).send({ success: true });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
