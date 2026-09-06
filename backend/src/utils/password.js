const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

module.exports = { hashPassword };
