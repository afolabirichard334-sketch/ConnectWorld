const jwt = require("jsonwebtoken");

function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Please log in to use chat."));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Your session has expired."));
  }
}

module.exports = { authenticateSocket };
