let _io = null;

function init(httpServer) {
  const { Server } = require('socket.io');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  _io = new Server(httpServer, {
    cors: { origin: allowedOrigins.length ? allowedOrigins : '*', methods: ['GET', 'POST'] },
  });

  _io.on('connection', (socket) => {
    // Customer joins their personal room
    socket.on('join_customer', (customerId) => {
      socket.join(`customer_${customerId}`);
    });

    // Vendor joins vendor room (emitted from admin backend too)
    socket.on('join_vendor', (vendorId) => {
      socket.join(`vendor_${vendorId}`);
    });

    socket.on('disconnect', () => {});
  });

  return _io;
}

function getIO() {
  if (!_io) throw new Error('Socket.io not initialised — call init() first');
  return _io;
}

module.exports = { init, getIO };
