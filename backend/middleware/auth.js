const { verifyToken } = require("../utils/token");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  req.user = user;
  next();
}

function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  req.user = verifyToken(token);
  next();
}

module.exports = { requireAuth, optionalAuth };
