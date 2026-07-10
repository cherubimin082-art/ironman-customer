const express  = require('express');
const http     = require('http');
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const pool     = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { getIO }       = require('../socket');
const { priceItems, OrderValidationError } = require('../utils/pricing');

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
  req.on('error', (err) => console.error('[emitToAdmin]', err.message));
  req.write(body);
  req.end();
}

const router = express.Router();

// Created lazily so a missing .env on the server doesn't crash startup
let _rzp = null;
function getRazorpay() {
  if (!_rzp) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)
      throw new Error('Razorpay keys not configured in .env');
    _rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _rzp;
}

// POST /api/payment/create-order
// Creates a Razorpay order for the cart's server-verified total (₹). Returns order ID + key for checkout.
// Takes `items` (garment_id + quantity) rather than a client-supplied amount, so the charge
// always matches real garment prices.
router.post('/payment/create-order', verifyToken, async (req, res) => {
  const { items } = req.body;

  let total;
  try {
    ({ total } = await priceItems(items));
  } catch (err) {
    if (err instanceof OrderValidationError) return res.status(400).json({ message: err.message });
    throw err;
  }

  try {
    const order = await getRazorpay().orders.create({
      amount:   Math.round(total * 100), // convert ₹ to paise
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

  // Verify HMAC signature (timing-safe compare — lengths must match before comparing bytes)
  const expectedBuf = Buffer.from(
    crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex'),
    'hex'
  );
  const givenBuf = Buffer.from(String(razorpay_signature || ''), 'hex');
  const signatureValid = expectedBuf.length === givenBuf.length && crypto.timingSafeEqual(expectedBuf, givenBuf);

  if (!signatureValid)
    return res.status(400).json({ message: 'Payment verification failed' });

  // Re-price the cart server-side, then confirm the customer actually paid this exact
  // amount — the Razorpay signature alone only proves *a* payment happened, not the amount.
  let pricedItems, total;
  try {
    ({ items: pricedItems, total } = await priceItems(items));
  } catch (err) {
    if (err instanceof OrderValidationError) return res.status(400).json({ message: err.message });
    throw err;
  }

  try {
    const paidOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    if (paidOrder.amount !== Math.round(total * 100))
      return res.status(400).json({ message: 'Paid amount does not match order total' });
  } catch (err) {
    console.error('Razorpay order fetch error:', err);
    return res.status(400).json({ message: 'Could not verify payment amount' });
  }

  // Validate order inputs
  const customerId = req.user.id;
  const custLat    = latitude  != null ? parseFloat(latitude)  : null;
  const custLng    = longitude != null ? parseFloat(longitude) : null;

  if (!apartment?.trim()) return res.status(400).json({ message: 'Apartment required' });
  if (!pickup_date)       return res.status(400).json({ message: 'Pickup date required' });

  const [[aptRow]] = await pool.query(
    'SELECT pickup_time FROM apartments WHERE name = ?', [apartment.trim()]
  );
  if (!aptRow) return res.status(400).json({ message: 'Unknown apartment' });
  const time_slot = aptRow.pickup_time;

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

    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (order_code, customer_id, apartment, pickup_date, time_slot, total, status, payment_method, customer_latitude, customer_longitude)
       VALUES ('PENDING', ?, ?, ?, ?, ?, 'pending', 'razorpay', ?, ?)`,
      [customerId, apartment.trim(), pickup_date, time_slot.trim(), total, custLat, custLng]
    );
    const orderId   = orderResult.insertId;
    const orderCode = `ORD-${String(orderId).padStart(3, '0')}`;
    await conn.query('UPDATE orders SET order_code = ? WHERE id = ?', [orderCode, orderId]);

    for (const item of pricedItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, garment_id, garment_name, quantity, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.garment_id, item.garment_name, item.quantity, item.unit_price, item.subtotal]
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

    emitToAdmin('vendor_room', 'new_order', { order, items: pricedItems });
    try { getIO().to(`customer_${customerId}`).emit('payment_complete'); } catch (_) {}

    res.status(201).json({ message: 'Order placed successfully', order, items: pricedItems });
  } catch (err) {
    await conn.rollback();
    console.error('verify-and-place error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// GET /api/payment/redirect-to-app
// Served after successful payment — meta-refresh opens ironman:// deep link
// (bypasses Chrome's user-gesture restriction on custom scheme navigation)
router.get('/payment/redirect-to-app', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head>
<meta http-equiv="refresh" content="0;url=ironman://payment-success">
</head><body></body></html>`);
});

// GET /api/payment/cancel
router.get('/payment/cancel', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head>
<meta http-equiv="refresh" content="0;url=ironman://payment-cancelled">
</head><body></body></html>`);
});

module.exports = router;
