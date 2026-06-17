const express = require('express');
const jwt     = require('jsonwebtoken');
const https   = require('https');
const pool    = require('../db');
require('dotenv').config();

const router = express.Router();

// ── WhatsApp OTP sender ─────────────────────────────────────
// Awaited before responding so the webhook fires before the user reaches the OTP page.
function sendWhatsAppOtp(phone10digit, otp) {
  const phone = '91' + phone10digit;
  const url   = `https://automate.cherubim.in/webhook/014bb05a-ec6e-4cda-b3dc-614b418dfe79?phone_number=${phone}&otp=${otp}`;
  const auth  = 'Basic b3RwX2F1dGg6QzAwTDc4Njk1NTk5';

  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: auth } }, res => {
      res.resume();
      resolve(res.statusCode);
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('webhook timeout')); });
    req.on('error', reject);
  });
}

// ── POST /api/auth/signup ───────────────────────────────────
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
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE phone = ?', [cleanPhone]
    );
    if (existing.length)
      return res.status(409).json({ message: 'Mobile number already registered. Please login instead.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await pool.query(
      'INSERT INTO users (name, phone, address, apartment, role, otp, is_verified) VALUES (?, ?, ?, ?, "customer", ?, 0)',
      [name.trim(), cleanPhone, address?.trim() || null, apartment.trim(), otp]
    );

    try {
      await sendWhatsAppOtp(cleanPhone, otp);
    } catch (err) {
      console.error('WhatsApp OTP send error (signup):', err.message);
    }

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
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND role = "customer"', [cleanPhone]
    );
    if (!rows.length)
      return res.status(404).json({ message: 'Number not registered. Please sign up first.' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await pool.query(
      'UPDATE users SET otp = ?, is_verified = 0 WHERE phone = ?', [otp, cleanPhone]
    );

    try {
      await sendWhatsAppOtp(cleanPhone, otp);
    } catch (err) {
      console.error('WhatsApp OTP send error (login):', err.message);
    }

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
    const [rows] = await pool.query(
      'SELECT id, name, phone, role, address, apartment, otp FROM users WHERE phone = ? AND role = "customer"',
      [cleanPhone]
    );

    if (!rows.length)
      return res.status(404).json({ message: 'Mobile number not found. Please go back and register.' });

    const user = rows[0];

    if (!user.otp)
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });

    if (String(otp).trim() !== String(user.otp).trim())
      return res.status(400).json({ message: 'Incorrect OTP, try again' });

    await pool.query(
      'UPDATE users SET is_verified = 1, otp = NULL WHERE id = ?', [user.id]
    );

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id:        user.id,
        name:      user.name,
        phone:     user.phone,
        role:      user.role,
        address:   user.address,
        apartment: user.apartment,
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
