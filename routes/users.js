const router = require("express").Router();
const { db } = require("../database/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { verifyJWT } = require("../middlewares/verifyJWT");

router.get("/me", verifyJWT, async function (req, res) {
  try {
    const reqUser = req.user
    //MAYBE COMBINE THESE TWO QUERIES ???>>
    const userConnectionsResponse = await db.query(
      `select page_id, page_name, connection_type from connections where user_id='${reqUser.id}'`
    );

    res.status(200).send({
      //since user can connect one channel right now, doing rows[0] here
      connectedChannel: userConnectionsResponse.rows[0],
      email: reqUser.email,
      id: reqUser.id
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post("/session", async function (req, res) {
  const { email, password: rawPassword } = req.body;

  try {
    const response = await db.query(`select * from users where email='${email}'`);

    if (response.rowCount > 0) {
      //check password

      const isPasswordMatch = await bcrypt.compare(rawPassword, response.rows[0].password);
      if (isPasswordMatch) {
        const accessToken = jwt.sign({ email }, process.env.JWT_SECRET_KEY, { expiresIn: "2d" });

        res.cookie("robocreateTkn", accessToken, {
          maxAge: 172800000,
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });

        res.status(200).send({ success: true });
        return;
      }
    }

    throw new Error("Email or Password is Invalid");
  } catch (err) {
    res.status(401).send({ error: err.message });
  }
});

router.delete("/session", verifyJWT, async function (req, res) {
  try {
    res.cookie("robocreateTkn", "", {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).send({ success: true, message: "Logout success" });
  } catch (err) {
    res.status(401).send({ error: err.message });
  }
});

module.exports = router;
