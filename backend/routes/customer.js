const express = require('express');
const pool    = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const APARTMENT_DEFAULT_TIME = require('../config/apartmentSlots');

const VALID_APARTMENTS = [
  'Green Valley Apartments',
  'Sunrise Residency',
  'Lake View Towers',
  'Palm Grove Apartments',
  'Maple Heights',
];

const router = express.Router();

// GET /api/customer/profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, phone, address, apartment, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('profile GET error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/customer/profile
// Body: { name, address, apartment }
router.put('/profile', verifyToken, async (req, res) => {
  const { name, address, apartment } = req.body;

  if (!name?.trim())
    return res.status(400).json({ message: 'Name is required' });
  if (!apartment?.trim() || !VALID_APARTMENTS.includes(apartment.trim()))
    return res.status(400).json({ message: 'Please select a valid apartment' });

  try {
    await pool.query(
      'UPDATE users SET name = ?, address = ?, apartment = ? WHERE id = ?',
      [name.trim(), address?.trim() || null, apartment.trim(), req.user.id]
    );
    const [rows] = await pool.query(
      'SELECT id, name, phone, address, apartment, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ message: 'Profile updated', user: rows[0] });
  } catch (err) {
    console.error('profile PUT error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/customer/apartment-slot/:apartment
// Returns vendor-configured pickup/delivery times; falls back to defaults if no vendor has set them.
router.get('/apartment-slot/:apartment', verifyToken, async (req, res) => {
  const apartment = decodeURIComponent(req.params.apartment);
  try {
    const [rows] = await pool.query(
      `SELECT pickup_time, delivery_time FROM apartment_slots WHERE apartment = ? LIMIT 1`,
      [apartment]
    );
    if (rows.length) {
      return res.json({ pickup_time: rows[0].pickup_time, delivery_time: rows[0].delivery_time, source: 'vendor' });
    }
    const defaultPickup = APARTMENT_DEFAULT_TIME[apartment] || null;
    res.json({ pickup_time: defaultPickup, delivery_time: null, source: 'default' });
  } catch (err) {
    console.error('apartment-slot GET error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
