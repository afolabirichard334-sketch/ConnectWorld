const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  const token = req.cookies?.connectworld_token ||
    (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Please log in first." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

module.exports = authenticate;
