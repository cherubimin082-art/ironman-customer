const express = require('express');
const http    = require('http');
const pool    = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const APARTMENT_DEFAULT_TIME = require('../config/apartmentSlots');

function emitToAdmin(room, event, payload) {
  const body = JSON.stringify({ room, event, payload });
  const req  = http.request(
    {
      hostname: 'localhost', port: 5002, path: '/api/internal/notify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    },
    (res) => res.resume()
  );
  req.on('error', () => {});
  req.write(body);
  req.end();
}

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

// PUT /api/customer/cancel-order/:orderId
router.put('/cancel-order/:orderId', verifyToken, async (req, res) => {
  const { orderId } = req.params;
  const customerId  = req.user.id;
  try {
    const [[order]] = await pool.query(
      `SELECT id, status, vendor_id FROM orders WHERE id = ? AND customer_id = ?`,
      [orderId, customerId]
    );
    if (!order)
      return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending')
      return res.status(409).json({ message: 'Order already accepted by vendor — cannot cancel' });

    await pool.query(
      `UPDATE orders SET status = 'cancelled', cancelled_by = 'customer' WHERE id = ?`,
      [orderId]
    );

    await pool.query(
      `INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, 'cancelled', ?)`,
      [orderId, customerId]
    );

    emitToAdmin('vendor_room', 'order_cancelled', { orderId: parseInt(orderId) });
    emitToAdmin('admin_room',  'order_cancelled', { orderId: parseInt(orderId) });

    res.json({ message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('cancel-order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
