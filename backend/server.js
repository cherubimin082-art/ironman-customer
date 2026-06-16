require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const pool       = require('./db');
const socketMod  = require('./socket');
const authRoutes     = require('./routes/auth');
const orderRoutes    = require('./routes/orders');
const customerRoutes = require('./routes/customer');
const paymentRoutes  = require('./routes/payment');

const app    = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Socket.io ───────────────────────────────────────────────
socketMod.init(server);

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api',          paymentRoutes);
app.use('/api',          orderRoutes);

// Internal bridge — admin backend (port 5002) POSTs here to reach customers via THIS socket.io instance
app.post('/api/internal/notify', (req, res) => {
  const { room, event, payload } = req.body || {};
  if (!room || !event) return res.status(400).json({ ok: false, error: 'room and event required' });
  try {
    socketMod.getIO().to(room).emit(event, payload);
    console.log(`[socket-bridge] ${event} → ${room}`, payload);
    res.json({ ok: true });
  } catch (err) {
    console.error('[socket-bridge] error:', err.message);
    res.status(500).json({ ok: false });
  }
});

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', service: 'smart-iron-customer', port: process.env.PORT })
);

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
