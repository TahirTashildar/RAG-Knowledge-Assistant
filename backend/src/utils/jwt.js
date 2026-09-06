const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function signToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function verifyToken(token) {
  // Throws JsonWebTokenError / TokenExpiredError — caller (middleware) handles it.
  return jwt.verify(token, jwtSecret);
}

module.exports = { signToken, verifyToken };
