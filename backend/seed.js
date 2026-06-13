// Seed demo customer account so the customer app can login immediately
require('dotenv').config();
const pool = require('./db');

async function seed() {
  try {
    // Upsert the demo customer from AuthContext
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE phone = '9800000001' AND role = 'customer'"
    );
    if (!existing.length) {
      await pool.query(
        "INSERT INTO users (name, phone, role, address) VALUES (?, ?, 'customer', ?)",
        [
          'Arjun Sharma',
          '9800000001',
          'Koramangala 5th Block, Bengaluru',
        ]
      );
      console.log('✅  Demo customer created: Arjun Sharma / 9876543210');
    } else {
      console.log('ℹ️   Demo customer already exists');
    }

    console.log('✅  Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
