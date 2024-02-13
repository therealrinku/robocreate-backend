const jwt = require("jsonwebtoken");

async function verifyJWT(req, res, next) {
  try {
    //in nextjs server side, req.cookies is empty object for some reason
    //so this is a hack to get cookie from header while server side rendering

    const temp = req.headers?.["set-cookie"]?.[0];
    const accessTokenFromHeader = temp ? JSON.parse(temp) : undefined;

    const accessToken = req.cookies["robocreateTkn"] || accessTokenFromHeader;

    if (!accessToken) return res.status(401).json({ error: "No token provided" });

    jwt.verify(accessToken, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) throw new Error(err);
      //pass user email to the request
      req.authUserEmail = user.email;
      next();
    });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

module.exports = { verifyJWT };
