const express  = require('express');
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const pool     = require('../db');
const { verifyToken }         = require('../middleware/authMiddleware');
const { getIO }               = require('../socket');
const APARTMENT_DEFAULT_TIME  = require('../config/apartmentSlots');

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
// Creates a Razorpay order for the given amount (₹). Returns order ID + key for checkout.
router.post('/payment/create-order', verifyToken, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0)
    return res.status(400).json({ message: 'Invalid amount' });

  try {
    const order = await razorpay.orders.create({
      amount:   Math.round(parseFloat(amount) * 100), // convert ₹ to paise
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    });
    res.json({
      razorpay_order_id: order.id,
      amount:            order.amount,
      currency:          order.currency,
      key_id:            process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay create-order error:', err);
    res.status(500).json({ message: 'Payment gateway error' });
  }
});

// POST /api/payment/verify-and-place
// Verifies Razorpay signature, then places the order in DB.
router.post('/payment/verify-and-place', verifyToken, async (req, res) => {
  const {
    razorpay_payment_id, razorpay_order_id, razorpay_signature,
    items, apartment, pickup_date, latitude, longitude,
  } = req.body;

  // Verify HMAC signature
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expected !== razorpay_signature)
    return res.status(400).json({ message: 'Payment verification failed' });

  // Validate order inputs
  const customerId = req.user.id;
  const custLat    = latitude  != null ? parseFloat(latitude)  : null;
  const custLng    = longitude != null ? parseFloat(longitude) : null;

  if (!items?.length)     return res.status(400).json({ message: 'No items provided' });
  if (!apartment?.trim()) return res.status(400).json({ message: 'Apartment required' });
  if (!pickup_date)       return res.status(400).json({ message: 'Pickup date required' });

  const time_slot = APARTMENT_DEFAULT_TIME[apartment.trim()];
  if (!time_slot) return res.status(400).json({ message: 'Unknown apartment' });

  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const chosen = new Date(pickup_date);
  if (isNaN(chosen.getTime()) || chosen < today)
    return res.status(400).json({ message: 'Invalid pickup date' });

  // Capacity check
  try {
    const [[vendorRow]] = await pool.query(
      `SELECT vendor_id FROM apartment_slots WHERE apartment = ? LIMIT 1`,
      [apartment.trim()]
    );
    if (vendorRow) {
      const [[capRow]] = await pool.query(
        `SELECT max_orders_per_day FROM vendor_capacity WHERE vendor_id = ? AND apartment = ?`,
        [vendorRow.vendor_id, apartment.trim()]
      );
      if (capRow) {
        const [[{ cnt }]] = await pool.query(
          `SELECT COUNT(*) AS cnt FROM orders WHERE apartment = ? AND pickup_date = ? AND status != 'cancelled'`,
          [apartment.trim(), pickup_date]
        );
        if (cnt >= capRow.max_orders_per_day)
          return res.status(409).json({ message: 'Slot full for selected date, please choose another date' });
      }
    }
  } catch (_) {}

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const total = items.reduce(
      (sum, i) => sum + parseFloat(i.unit_price) * parseInt(i.quantity), 0
    );

    const [lastRow] = await conn.query('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
    const nextNum   = lastRow.length ? lastRow[0].id + 1 : 1;
    const orderCode = `ORD-${String(nextNum).padStart(3, '0')}`;

    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (order_code, customer_id, apartment, pickup_date, time_slot, total, status, payment_method, customer_latitude, customer_longitude)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', 'razorpay', ?, ?)`,
      [orderCode, customerId, apartment.trim(), pickup_date, time_slot.trim(), total, custLat, custLng]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const subtotal = parseFloat(item.unit_price) * parseInt(item.quantity);
      await conn.query(
        `INSERT INTO order_items (order_id, garment_id, garment_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.garment_id, item.garment_name, item.quantity, item.unit_price, subtotal]
      );
    }

    await conn.query(
      'INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)',
      [orderId, 'pending', customerId]
    );

    await conn.commit();

    const [orderRows] = await pool.query(
      `SELECT o.*, u.name AS customer_name FROM orders o JOIN users u ON u.id = o.customer_id WHERE o.id = ?`,
      [orderId]
    );
    const order = orderRows[0];

    try { getIO().to('vendor_room').emit('new_order', { order, items }); } catch (_) {}

    res.status(201).json({ message: 'Order placed successfully', order, items });
  } catch (err) {
    await conn.rollback();
    console.error('verify-and-place error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

module.exports = router;
