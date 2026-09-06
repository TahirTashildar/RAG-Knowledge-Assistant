const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Protects any route: requires "Authorization: Bearer <token>".
// On success, attaches req.userId (string) — every controller downstream
// uses this, never a userId taken from the request body/query, so a client
// can never impersonate another user by passing a different id.
async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    return next(new Error('Not authenticated: missing token'));
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401);
      return next(new Error('Not authenticated: user no longer exists'));
    }
    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    const message = err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid authentication token';
    next(new Error(message));
  }
}

module.exports = { protect };
