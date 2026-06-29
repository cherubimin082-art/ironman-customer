const express = require('express');
const http    = require('http');
const pool    = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

function emitToAdmin(room, event, payload) {
  const body = JSON.stringify({ room, event, payload });
  const req  = http.request(
    {
      hostname: 'localhost', port: 5002, path: '/api/internal/notify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-internal-secret': process.env.INTERNAL_SECRET,
      },
    },
    (res) => res.resume()
  );
  req.on('error', () => {});
  req.write(body);
  req.end();
}

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
  if (!apartment?.trim())
    return res.status(400).json({ message: 'Please select a valid apartment' });

  try {
    const [[aptRow]] = await pool.query(
      'SELECT id FROM apartments WHERE name = ?', [apartment.trim()]
    );
    if (!aptRow)
      return res.status(400).json({ message: 'Please select a valid apartment' });

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
    const [[aptRow]] = await pool.query(
      'SELECT pickup_time, delivery_time FROM apartments WHERE name = ? LIMIT 1',
      [apartment]
    );
    res.json({ pickup_time: aptRow?.pickup_time || null, delivery_time: aptRow?.delivery_time || null, source: 'default' });
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
      `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
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

// POST /api/customer/rate-order/:orderId
router.post('/rate-order/:orderId', verifyToken, async (req, res) => {
  const orderId    = parseInt(req.params.orderId);
  const customerId = req.user.id;
  const { vendor_rating, delivery_rating, vendor_review, delivery_review } = req.body;

  if (!vendor_rating && !delivery_rating)
    return res.status(400).json({ message: 'Provide at least one rating' });

  try {
    const [[order]] = await pool.query(
      `SELECT id, status, vendor_id, delivery_agent_id FROM orders WHERE id = ? AND customer_id = ?`,
      [orderId, customerId]
    );
    if (!order)          return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'delivered')
      return res.status(409).json({ message: 'Can only rate delivered orders' });

    const [[existing]] = await pool.query(`SELECT id FROM ratings WHERE order_id = ?`, [orderId]);
    if (existing)        return res.status(409).json({ message: 'Already rated' });

    await pool.query(
      `INSERT INTO ratings
         (order_id, customer_id, vendor_id, delivery_agent_id,
          vendor_rating, delivery_rating, vendor_review, delivery_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, customerId, order.vendor_id, order.delivery_agent_id,
        vendor_rating || null, delivery_rating || null,
        vendor_review?.trim() || null, delivery_review?.trim() || null,
      ]
    );
    res.json({ message: 'Rating saved' });
  } catch (err) {
    console.error('rate-order error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/customer/order-rating/:orderId
router.get('/order-rating/:orderId', verifyToken, async (req, res) => {
  const orderId    = parseInt(req.params.orderId);
  const customerId = req.user.id;
  try {
    const [[row]] = await pool.query(
      `SELECT r.vendor_rating, r.delivery_rating, r.vendor_review, r.delivery_review
         FROM ratings r
         JOIN orders o ON o.id = r.order_id
        WHERE r.order_id = ? AND o.customer_id = ?`,
      [orderId, customerId]
    );
    res.json({ rating: row || null });
  } catch (err) {
    console.error('order-rating error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
