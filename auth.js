const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const sendVerificationEmail = require('../utils/mail');
const db = require('../db');

// GET: Login page
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/index');
  const message = req.session.message;
  delete req.session.message;
  res.render('login', { message });
});

// POST: Handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.message = '❗ Email and password are required.';
    return res.redirect('/login');
  }

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      req.session.message = '❗ User not found. Please register.';
      return res.redirect('/login');
    }

    const user = users[0];

    if (!user.is_verified) {
      req.session.message = '⚠️ Please verify your email before logging in.';
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.session.message = '❗ Incorrect password.';
      return res.redirect('/login');
    }

    req.session.user = {id: user.id,email: user.email};
    res.redirect('/index');
  } catch (err) {
    console.error(err);
    req.session.message = '❌ Server error during login.';
    res.redirect('/login');
  }
});

// GET: Registration page
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/index');
  const message = req.session.message;
  delete req.session.message;
  res.render('register', { message });
});

// POST: Handle registration
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.session.message = '❗ Email and password are required.';
    return res.redirect('/register');
  }

  try {
    const [existing] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      req.session.message = '⚠️ User already exists. Please login.';
      return res.redirect('/login');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = uuidv4();

    await db.promise().query(
      'INSERT INTO users (email, password, verification_token) VALUES (?, ?, ?)',
      [email, hashedPassword, token]
    );

    await sendVerificationEmail(email, token);
    req.session.message = '✅ Registration successful. Check your email to verify your account.';
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.session.message = '❌ Server error during registration.';
    res.redirect('/register');
  }
});

// GET: Email verification
router.get('/verify', async (req, res) => {
  const { token } = req.query;

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM users WHERE verification_token = ?',
      [token]
    );

    if (rows.length === 0) {
      req.session.message = '❗ Invalid or expired verification link.';
      return res.redirect('/login');
    }

    const user = rows[0];
    await db.promise().query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
      [user.id]
    );

    req.session.user = {id: user.id,email: user.email};
    req.session.message = '✅ Email verified successfully!';
    res.redirect('/index');
  } catch (err) {
    console.error(err);
    req.session.message = '❌ Error verifying email.';
    res.redirect('/login');
  }
});

// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
