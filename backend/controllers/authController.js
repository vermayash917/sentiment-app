// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function register(req, res){
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'email, password required' });
    const existing = await User.findOne({ email });
    if(existing) return res.status(400).json({ error: 'email in use' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ email, passwordHash });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email }});
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

async function login(req, res){
  try {
    const { email, password } = req.body;
    if(!email || !password) return res.status(400).json({ error: 'email, password required' });
    const user = await User.findOne({ email });
    if(!user) return res.status(400).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if(!ok) return res.status(400).json({ error: 'invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email }});
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
}

module.exports = { register, login };
