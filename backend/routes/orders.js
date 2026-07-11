const express        = require('express');
const http           = require('http');
const crypto         = require('crypto');
const jwt            = require('jsonwebtoken');
const pool           = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const { getIO }      = require('../socket');
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

// ── POST /api/place-order ─────────────────────────────────────────────
// Body: { items, apartment, pickup_date }
router.post('/place-order', verifyToken, async (req, res) => {
  const { items, apartment, pickup_date, latitude, longitude } = req.body;
  const customerId = req.user.id;
  const custLat = (latitude  !== undefined && latitude  !== null) ? parseFloat(latitude)  : null;
  const custLng = (longitude !== undefined && longitude !== null) ? parseFloat(longitude) : null;

  if (!items || !items.length)
    return res.status(400).json({ message: 'No items provided' });
  if (!apartment?.trim())
    return res.status(400).json({ message: 'Please select your apartment' });
  if (!pickup_date)
    return res.status(400).json({ message: 'Pickup date is required' });

  // Derive fixed pickup time from apartment — read from DB so admin changes take effect
  const [[aptRow]] = await pool.query(
    'SELECT pickup_time, delivery_day_offset FROM apartments WHERE name = ?', [apartment.trim()]
  );
  if (!aptRow)
    return res.status(400).json({ message: 'Unknown apartment — cannot determine pickup time' });
  const time_slot     = aptRow.pickup_time;
  const delivery_date = addDaysToDateString(pickup_date, aptRow.delivery_day_offset || 0);

  // Ensure pickup_date is today or in the future
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const chosen = new Date(pickup_date);
  if (isNaN(chosen.getTime()) || chosen < today)
    return res.status(400).json({ message: 'Pickup date must be today or a future date' });

  // Capacity check — find vendor for this apartment, then check daily order limit
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

  let pricedItems, total;
  try {
    ({ items: pricedItems, total } = await priceItems(items));
  } catch (err) {
    if (err instanceof OrderValidationError) return res.status(400).json({ message: err.message });
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      `INSERT INTO orders (order_code, customer_id, apartment, pickup_date, time_slot, delivery_date, total, status, customer_latitude, customer_longitude)
       VALUES ('PENDING', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [customerId, apartment.trim(), pickup_date, time_slot.trim(), delivery_date, total, custLat, custLng]
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
      `SELECT o.*, u.name AS customer_name
         FROM orders o JOIN users u ON u.id = o.customer_id
        WHERE o.id = ?`,
      [orderId]
    );
    const order = orderRows[0];

    emitToAdmin('vendor_room', 'new_order', { order, items: pricedItems });

    res.status(201).json({ message: 'Order placed successfully', order, items: pricedItems });
  } catch (err) {
    await conn.rollback();
    console.error('place-order error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// ── GET /api/my-orders ────────────────────────────────────────────────
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*,
              u_agent.name  AS agent_name,
              u_agent.phone AS agent_phone,
              COALESCE(
                (SELECT GROUP_CONCAT(DISTINCT b2.bag_number ORDER BY b2.bag_number SEPARATOR ',')
                   FROM order_bags ob2 JOIN bags b2 ON b2.id = ob2.bag_id WHERE ob2.order_id = o.id),
                (SELECT CAST(b3.bag_number AS CHAR) FROM bags b3 WHERE b3.id = o.bag_id)
              ) AS bag_numbers,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id',           oi.id,
                  'garment_id',   oi.garment_id,
                  'garment_name', oi.garment_name,
                  'quantity',     oi.quantity,
                  'unit_price',   oi.unit_price,
                  'subtotal',     oi.subtotal
                )
              ) AS items
         FROM orders o
         LEFT JOIN users u_agent ON u_agent.id = o.delivery_agent_id
         JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders });
  } catch (err) {
    console.error('my-orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/order-status/:id ─────────────────────────────────────────
router.get('/order-status/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.order_code, o.status, o.time_slot, o.pickup_date, o.apartment, o.total, o.updated_at, o.created_at,
              u_vendor.name AS vendor_name,
              u_agent.name  AS agent_name,
              u_agent.phone AS agent_phone
         FROM orders o
         LEFT JOIN users u_vendor ON u_vendor.id = o.vendor_id
         LEFT JOIN users u_agent  ON u_agent.id  = o.delivery_agent_id
        WHERE o.id = ? AND o.customer_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Order not found' });

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    const [history] = await pool.query(
      'SELECT status, created_at FROM order_status_history WHERE order_id = ? ORDER BY id ASC',
      [req.params.id]
    );
    res.json({ order: rows[0], items, history });
  } catch (err) {
    console.error('order-status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/apartments ───────────────────────────────────────────────
router.get('/apartments', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, pickup_time, delivery_time FROM apartments ORDER BY id ASC'
    );
    res.json({ apartments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /api/garments ─────────────────────────────────────────────────
// Catalogue is vendor-scoped: each center head (vendor) sets their own
// categories/garments/pricing. The vendor shown is the one assigned to the
// logged-in customer's apartment. Anonymous/pre-signup browsing falls back
// to any assigned vendor's catalogue as a preview.
router.get('/garments', async (req, res) => {
  try {
    let vendorId = null;

    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [[customer]] = await pool.query('SELECT apartment FROM users WHERE id = ?', [decoded.id]);
        if (customer?.apartment) {
          const [[slot]] = await pool.query(
            'SELECT vendor_id FROM apartment_slots WHERE apartment = ? LIMIT 1',
            [customer.apartment]
          );
          if (slot) vendorId = slot.vendor_id;
        }
      } catch (_) { /* invalid/expired token — fall through to anonymous browsing */ }
    }

    if (!vendorId) {
      const [[anyVendor]] = await pool.query(
        'SELECT vendor_id FROM apartment_slots ORDER BY vendor_id ASC LIMIT 1'
      );
      vendorId = anyVendor?.vendor_id || null;
    }

    if (!vendorId) return res.json({ garments: [] });

    const [rows] = await pool.query(
      `SELECT g.id, g.name, g.price, g.icon, g.image_url,
              c.name AS category
         FROM garments g
         LEFT JOIN categories c ON c.id = g.category_id
        WHERE g.is_active = 1 AND g.vendor_id = ?
        ORDER BY c.name, g.name`,
      [vendorId]
    );
    res.json({ garments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /api/internal/notify ─────────────────────────────────────────
router.post('/internal/notify', (req, res) => {
  const expected = Buffer.from(process.env.INTERNAL_SECRET || '');
  const given    = Buffer.from(String(req.headers['x-internal-secret'] || ''));
  const valid    = expected.length > 0 && expected.length === given.length && crypto.timingSafeEqual(expected, given);
  if (!valid) return res.status(403).json({ ok: false });
  const { room, event, payload } = req.body;
  try {
    getIO().to(room).emit(event, payload);
    res.json({ ok: true });
  } catch (_) {
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
