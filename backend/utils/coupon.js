const pool = require('../db');
const { todayISTDateString } = require('./scheduling');

// coupons is owned by the vendor (Center Head) - created via the admin/vendor
// backend's CRUD, but read here at checkout. Both sides self-provision with
// an identical CREATE TABLE IF NOT EXISTS rather than assuming the other one
// ran first - same lesson as ensureOrderBlockColumn in scheduling.js.
let couponSchemaEnsured = false;
async function ensureCouponSchema() {
  if (couponSchemaEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      vendor_id INT NOT NULL,
      code VARCHAR(30) NOT NULL UNIQUE,
      discount_type ENUM('percent','flat') NOT NULL DEFAULT 'percent',
      discount_value DECIMAL(10,2) NOT NULL,
      valid_from DATE NULL,
      valid_till DATE NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [[col1]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_code'`
  );
  if (col1.cnt === 0) {
    await pool.query("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(30) NULL");
  }
  const [[col2]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'discount_amount'`
  );
  if (col2.cnt === 0) {
    await pool.query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0");
  }
  // apartments = NULL means "all of this vendor's apartments"; otherwise a
  // JSON array of apartment names this coupon is restricted to.
  const [[col3]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coupons' AND COLUMN_NAME = 'apartments'`
  );
  if (col3.cnt === 0) {
    await pool.query("ALTER TABLE coupons ADD COLUMN apartments TEXT NULL");
  }
  couponSchemaEnsured = true;
}

// Looks up `code`, checks it belongs to `vendorId` (the apartment's assigned
// Center Head), is active, applies to `apartment` (if the coupon is restricted
// to specific apartments), and is within its valid_from/valid_till window,
// then computes the discount off `amount` - always capped at `amount` so a
// coupon can never make the charge negative. Never trusts a client-supplied
// discount figure; this is the only place a discount amount is derived.
async function validateCoupon(code, amount, vendorId, apartment) {
  if (!code || !String(code).trim()) {
    return { valid: false, discount: 0, message: 'Enter a coupon code' };
  }
  const [[row]] = await pool.query(
    `SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) LIMIT 1`,
    [String(code).trim()]
  );
  if (!row) return { valid: false, discount: 0, message: 'Invalid coupon code' };
  if (vendorId && row.vendor_id !== vendorId) {
    return { valid: false, discount: 0, message: 'This coupon is not valid for this store' };
  }
  if (row.apartments) {
    let allowed = [];
    try { allowed = JSON.parse(row.apartments); } catch (_) {}
    if (!apartment || !allowed.includes(apartment)) {
      return { valid: false, discount: 0, message: 'This coupon is not valid for this apartment' };
    }
  }
  if (!row.active) return { valid: false, discount: 0, message: 'This coupon is no longer active' };

  const today = todayISTDateString();
  if (row.valid_from && today < row.valid_from.toISOString().slice(0, 10)) {
    return { valid: false, discount: 0, message: 'This coupon is not active yet' };
  }
  if (row.valid_till && today > row.valid_till.toISOString().slice(0, 10)) {
    return { valid: false, discount: 0, message: 'This coupon has expired' };
  }

  const value = parseFloat(row.discount_value);
  let discount = row.discount_type === 'percent' ? (amount * value) / 100 : value;
  discount = Math.max(0, Math.min(discount, amount));
  discount = Math.round(discount * 100) / 100;

  return { valid: true, discount, message: null, code: row.code };
}

module.exports = { ensureCouponSchema, validateCoupon };
