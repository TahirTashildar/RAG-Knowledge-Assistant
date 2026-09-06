const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { hashPassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });

  const token = signToken(user._id.toString());

  res.status(201).json({
    success: true,
    message: 'Account created',
    data: { user, token },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // passwordHash has `select: false` in the schema — must opt in explicitly.
  const user = await User.findOne({ email }).select('+passwordHash');
  const validCredentials = user ? await user.comparePassword(password) : false;

  if (!validCredentials) {
    res.status(401);
    // Deliberately identical message for "no such user" and "wrong password" —
    // never reveal which one it was, that leaks which emails are registered.
    throw new Error('Invalid email or password');
  }

  const token = signToken(user._id.toString());

  res.json({
    success: true,
    message: 'Logged in',
    data: { user, token },
  });
});

// POST /api/auth/logout
// JWTs are stateless — there's no server-side session to destroy. "Logout"
// is the frontend discarding its stored token. This endpoint exists for a
// consistent API surface and as the place to add token revocation later
// (e.g. a denylist) if that's ever needed.
const logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out', data: {} });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Current user', data: { user: req.user } });
});

module.exports = { register, login, logout, me };
