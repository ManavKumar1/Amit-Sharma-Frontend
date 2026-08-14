const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const COOKIE_NAME = 'token';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  // Same generic message whether the email doesn't exist or the password is
  // wrong — don't tell an attacker which one it got right.
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  res.cookie(COOKIE_NAME, token, cookieOptions());
  res.json({ id: user._id, name: user.name, email: user.email });
}

function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
}

async function me(req, res) {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(user);
}

// Public — lets login.html tell the difference between "wrong password"
// and "nobody has run the seed script yet" without leaking any account details.
async function setupStatus(req, res) {
  const count = await User.countDocuments();
  res.json({ hasOwner: count > 0 });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are both required.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();
  res.json({ ok: true });
}

module.exports = { login, logout, me, setupStatus, changePassword, COOKIE_NAME };