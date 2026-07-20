const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.accessExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.refreshSecret, { expiresIn: config.refreshExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
