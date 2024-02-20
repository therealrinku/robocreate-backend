const jwt = require("jsonwebtoken");

async function verifyJWT(req, res, next) {
  try {
    const accessToken = req.cookies["robocreateTkn"];

    if (!accessToken) return res.status(401).json({ error: "No token provided" });

    jwt.verify(accessToken, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) throw new Error(err);
      //pass user id to the request
      req.user = user;
      next();
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

module.exports = { verifyJWT };
