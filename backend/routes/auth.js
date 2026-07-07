const express = require('express');
const jwt     = require('jsonwebtoken');
const https   = require('https');
const pool    = require('../db');
require('dotenv').config();

const router = express.Router();

function makeOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ── WhatsApp OTP sender (POST) ──────────────────────────────
function sendWhatsAppOtp(phone10digit, otp) {
  const phone = '91' + phone10digit;
  const path  = `/webhook/e85975b1-fc4f-4537-8e99-1bf3c70729ad?phone_number=${phone}&otp=${otp}`;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'automate.cherubim.in',
        path,
        method:  'POST',
        headers: { Authorization: 'Basic b3RwX2F1dGg6QzAwTDc4Njk1NTk5' },
      },
      res => { res.resume(); resolve(res.statusCode); }
    );
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('webhook timeout')); });
    req.on('error', reject);
    req.end();
  });
}

// ── POST /api/auth/signup ───────────────────────────────────
// Stores data in signup_otp temp table — NOT in users yet.
// User is only created in users after OTP is verified.
router.post('/signup', async (req, res) => {
  const { name, address, apartment, mobile_number } = req.body;

  if (!name?.trim() || !mobile_number)
    return res.status(400).json({ message: 'name and mobile_number are required' });
  if (!apartment?.trim())
    return res.status(400).json({ message: 'Please select your apartment' });

  const cleanPhone = String(mobile_number).replace(/\D/g, '');
  if (cleanPhone.length !== 10)
    return res.status(400).json({ message: 'Mobile number must be 10 digits' });

  try {
    // Already a verified user → send to login
    const [[verified]] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND role = "customer" AND is_verified = 1',
      [cleanPhone]
    );
    if (verified)
      return res.status(409).json({ message: 'Mobile number already registered. Please login instead.' });

    // Upsert into temp table (resend = update OTP)
    const otp = makeOtp();
    await pool.query(
      `INSERT INTO signup_otp (phone, otp, name, address, apartment)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE otp = VALUES(otp), name = VALUES(name),
         address = VALUES(address), apartment = VALUES(apartment), created_at = NOW()`,
      [cleanPhone, otp, name.trim(), address?.trim() || null, apartment.trim()]
    );

    try { await sendWhatsAppOtp(cleanPhone, otp); }
    catch (err) { console.error('WhatsApp OTP send error (signup):', err.message); }

    res.status(201).json({ message: 'OTP sent to your WhatsApp' });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  const { mobile_number } = req.body;

  if (!mobile_number)
    return res.status(400).json({ message: 'mobile_number is required' });

  const cleanPhone = String(mobile_number).replace(/\D/g, '');
  if (cleanPhone.length !== 10)
    return res.status(400).json({ message: 'Mobile number must be 10 digits' });

  try {
    const [[user]] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND role = "customer" AND is_verified = 1',
      [cleanPhone]
    );
    if (!user)
      return res.status(404).json({ message: 'Number not registered. Please sign up first.' });

    const otp = makeOtp();
    await pool.query('UPDATE users SET otp = ? WHERE id = ?', [otp, user.id]);

    try { await sendWhatsAppOtp(cleanPhone, otp); }
    catch (err) { console.error('WhatsApp OTP send error (login):', err.message); }

    res.json({ message: 'OTP sent to your WhatsApp' });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/auth/verify-otp ───────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { mobile_number, otp } = req.body;

  if (!mobile_number || !otp)
    return res.status(400).json({ message: 'mobile_number and otp are required' });

  const cleanPhone = String(mobile_number).replace(/\D/g, '');

  try {
    // ── Case 1: pending signup in signup_otp ──
    const [[pending]] = await pool.query(
      'SELECT * FROM signup_otp WHERE phone = ?', [cleanPhone]
    );

    if (pending) {
      if (String(otp).trim() !== String(pending.otp).trim())
        return res.status(400).json({ message: 'Incorrect OTP, try again' });

      // OTP valid — check if user already exists (handles duplicate-phone edge case)
      const [[existingUser]] = await pool.query(
        'SELECT id, name, phone, role, address, apartment FROM users WHERE phone = ? AND role = "customer"',
        [cleanPhone]
      );
      await pool.query('DELETE FROM signup_otp WHERE phone = ?', [cleanPhone]);

      let loginUser;
      if (existingUser) {
        // Already in DB (previous partial signup) — mark verified and log in
        await pool.query('UPDATE users SET is_verified = 1 WHERE id = ?', [existingUser.id]);
        loginUser = existingUser;
      } else {
        const [result] = await pool.query(
          'INSERT INTO users (name, phone, address, apartment, role, is_verified) VALUES (?, ?, ?, ?, "customer", 1)',
          [pending.name, pending.phone, pending.address, pending.apartment]
        );
        loginUser = { id: result.insertId, name: pending.name, phone: pending.phone, role: 'customer', address: pending.address, apartment: pending.apartment };
      }

      const token = jwt.sign(
        { id: loginUser.id, name: loginUser.name, phone: loginUser.phone, role: loginUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        message: existingUser ? 'Login successful' : 'Signup successful',
        token,
        user: { id: loginUser.id, name: loginUser.name, phone: loginUser.phone, role: loginUser.role, address: loginUser.address, apartment: loginUser.apartment },
      });
    }

    // ── Case 2: existing user login ──
    const [[user]] = await pool.query(
      'SELECT id, name, phone, role, address, apartment, otp FROM users WHERE phone = ? AND role = "customer"',
      [cleanPhone]
    );

    if (!user)
      return res.status(404).json({ message: 'Mobile number not found. Please go back and register.' });

    if (!user.otp)
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    if (String(otp).trim() !== String(user.otp).trim())
      return res.status(400).json({ message: 'Incorrect OTP, try again' });

    await pool.query('UPDATE users SET is_verified = 1, otp = NULL WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id, name: user.name, phone: user.phone,
        role: user.role, address: user.address, apartment: user.apartment,
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
