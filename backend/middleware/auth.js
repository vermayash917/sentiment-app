// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ error: 'no token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select('-passwordHash');
    next();
  } catch(err){
    return res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { authMiddleware };
