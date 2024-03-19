const router = require("express").Router();
const { db } = require("../database/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const { verifyJWT } = require("../middlewares/verifyJWT");
const { constants } = require("../helpers/constants");

const cookieOptions = {
  maxAge: 172800000,
  httpOnly: true,
  secure: true,
  sameSite: "none",
};

async function me(req, res) {
  try {
    const reqUser = req.user;

    const userConnectionsResponse = await db.query(
      `select id, page_id, page_name, connection_type from connections where user_id='${reqUser.id}'`
    );

    res.status(200).send({
      connections: userConnectionsResponse.rows,
      email: reqUser.email,
      id: reqUser.id,
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
}

async function createAccount(req, res) {
  const { email, password: rawPassword } = req.body;

  try {
    const query = await db.query(`select id from users where email='${email}'`);

    if (query.rowCount > 0) {
      throw new Error("Email is already taken");
    }

    bcrypt.hash(rawPassword, 10, async (err, hashedPassword) => {
      if (err) {
        throw new Error("Something went wrong.");
      } else {
        const response = await db.query(
          `insert into users(email, password) values('${email}','${hashedPassword}') returning id`
        );
        //create session after signup as well
        const jwtObject = { email, id: response.rows[0].id };
        const accessToken = jwt.sign(jwtObject, constants.jwtSecretKey, { expiresIn: constants.jwtExpiry });

        res.cookie("robocreate_session", accessToken, cookieOptions);
        res.status(200).send({ success: true });
      }
    });
  } catch (err) {
    res.status(422).send({ error: err.message });
  }
}

async function createSession(req, res) {
  const { email, password: rawPassword } = req.body;

  try {
    const response = await db.query(`select * from users where email='${email}'`);

    if (response.rowCount > 0) {
      const isPasswordMatch = await bcrypt.compare(rawPassword, response.rows[0].password);
      if (isPasswordMatch) {
        const jwtObject = { email, id: response.rows[0].id };
        const accessToken = jwt.sign(jwtObject, constants.jwtSecretKey, { expiresIn: constants.jwtExpiry });

        res.cookie("robocreate_session", accessToken, cookieOptions);
        res.status(200).send({ success: true });
        return;
      }
    }

    throw new Error("Email or Password is Invalid");
  } catch (err) {
    res.status(401).send({ error: err.message });
  }
}

async function deleteSession(_req, res) {
  try {
    const deleteSessionCookieOptions = {
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    };
    res.cookie("robocreate_session", "", deleteSessionCookieOptions);
    res.status(200).send({ success: true, message: "Logout success" });
  } catch (err) {
    res.status(401).send({ error: err.message });
  }
}

router.get("/me", verifyJWT, me);
router.post("/create-account", createAccount);
router.post("/session", createSession);
router.delete("/session", verifyJWT, deleteSession);

module.exports = router;
