const express  = require('express');
const http     = require('http');
const crypto   = require('crypto');
const Razorpay = require('razorpay');
const pool     = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { getIO }       = require('../socket');
const { priceItems, OrderValidationError } = require('../utils/pricing');
const { addDaysToDateString } = require('../utils/scheduling');

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
// Creates a Razorpay order for the cart's server-verified total (₹). Returns order ID + key.
// Prefers re-pricing from `items` (garment_id + quantity) so the charge always matches real
// garment prices — a client can never dictate its own total this way. Falls back to a raw
// client-supplied `amount` only when `items` is absent, so an older/stale client build can't
// hard-break checkout; today's frontend always sends `items`, so that path is effectively dead.
router.post('/payment/create-order', verifyToken, async (req, res) => {
  const { items, amount } = req.body;

  let total;
  if (Array.isArray(items) && items.length) {
    try {
      ({ total } = await priceItems(items));
    } catch (err) {
      if (err instanceof OrderValidationError) return res.status(400).json({ message: err.message });
      console.error('priceItems error:', err);
      return res.status(500).json({ message: 'Server error' });
    }
  } else if (amount && amount > 0) {
    total = parseFloat(amount);
  } else {
    return res.status(400).json({ message: 'Invalid amount' });
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
// Verifies Razorpay signature, then places the order in DB. The order's money total
// comes from Razorpay's own confirmed paid amount (not from re-deriving it a second
// time client-side or server-side) — that amount was already fixed, tamper-resistant,
// at create-order time, so it's the simplest and most reliable source of truth here.
router.post('/payment/verify-and-place', verifyToken, async (req, res) => {
  const {
    razorpay_payment_id, razorpay_order_id, razorpay_signature,
    items, apartment, pickup_date, latitude, longitude,
  } = req.body;

  // Verify HMAC signature (timing-safe compare)
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

  // Trusted total: what Razorpay actually confirms was paid for this order, not
  // anything the client claims. Falls back to failing closed if the fetch itself
  // errors (network hiccup etc) rather than trusting client input.
  let total;
  try {
    const paidOrder = await getRazorpay().orders.fetch(razorpay_order_id);
    total = paidOrder.amount / 100;
  } catch (err) {
    console.error('Razorpay order fetch error:', err);
    return res.status(400).json({ message: 'Could not verify payment amount' });
  }

  // Validate order inputs
  const customerId = req.user.id;
  const custLat    = latitude  != null ? parseFloat(latitude)  : null;
  const custLng    = longitude != null ? parseFloat(longitude) : null;

  if (!items?.length)     return res.status(400).json({ message: 'No items provided' });
  if (!apartment?.trim()) return res.status(400).json({ message: 'Apartment required' });
  if (!pickup_date)       return res.status(400).json({ message: 'Pickup date required' });

  const [[aptRow]] = await pool.query(
    'SELECT pickup_time, delivery_day_offset FROM apartments WHERE name = ?', [apartment.trim()]
  );
  if (!aptRow) return res.status(400).json({ message: 'Unknown apartment' });
  const time_slot     = aptRow.pickup_time;
  const delivery_date = addDaysToDateString(pickup_date, aptRow.delivery_day_offset || 0);

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

  // Best-effort re-pricing for accurate per-item records (garment name/price at time
  // of order). The order's actual money total above already comes from Razorpay, so a
  // failure here (e.g. a garment deactivated in the last few seconds) falls back to the
  // client's item details rather than blocking an already-paid order from being placed.
  let lineItems = items;
  try {
    ({ items: lineItems } = await priceItems(items));
  } catch (_) {}

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders
         (order_code, customer_id, apartment, pickup_date, time_slot, delivery_date, total, status, payment_method, customer_latitude, customer_longitude)
       VALUES ('PENDING', ?, ?, ?, ?, ?, ?, 'pending', 'razorpay', ?, ?)`,
      [customerId, apartment.trim(), pickup_date, time_slot.trim(), delivery_date, total, custLat, custLng]
    );
    const orderId   = orderResult.insertId;
    const orderCode = `ORD-${String(orderId).padStart(3, '0')}`;
    await conn.query('UPDATE orders SET order_code = ? WHERE id = ?', [orderCode, orderId]);

    for (const item of lineItems) {
      const subtotal = item.subtotal ?? parseFloat(item.unit_price) * parseInt(item.quantity);
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

    emitToAdmin('vendor_room', 'new_order', { order, items: lineItems });
    try { getIO().to(`customer_${customerId}`).emit('payment_complete'); } catch (_) {}

    res.status(201).json({ message: 'Order placed successfully', order, items: lineItems });
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
