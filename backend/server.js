require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const pool       = require('./db');
const socketMod  = require('./socket');
const authRoutes     = require('./routes/auth');
const orderRoutes    = require('./routes/orders');
const customerRoutes = require('./routes/customer');
const paymentRoutes  = require('./routes/payment');

const app    = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────
// If ALLOWED_ORIGINS isn't set (e.g. local/dev without it configured yet), fall back to
// open CORS so existing deployments keep working until the env var is added.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors(allowedOrigins.length ? {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
} : { origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Socket.io ───────────────────────────────────────────────
socketMod.init(server);

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api',          paymentRoutes);
app.use('/api',          orderRoutes);

// Note: /api/internal/notify (the admin → customer socket bridge) is handled by
// orderRoutes (routes/orders.js), which checks x-internal-secret before emitting.

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'smart-iron-customer', port: process.env.PORT })
);

// Serve Razorpay payment page
app.get('/pay', (_req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'pay.html'))
);

// App version check — APK compares its baked-in build number against this
app.get('/api/version', (_req, res) => {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8'));
    res.json(v);
  } catch (_) { res.json({ version: 1 }); }
});

// ── Start ───────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 5001;

async function start() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log('✅  MySQL connected  →  iron_platform');
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`🚀  Smart-iron customer API running on http://localhost:${PORT}`);
  });
}

start();
