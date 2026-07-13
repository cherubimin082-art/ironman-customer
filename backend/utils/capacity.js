const pool = require('../db');

// Shared by the slot-availability check (customer picks a date), create-order
// (before payment), verify-and-place (after payment, as a race-condition
// safety net) and place-order (COD) - one source of truth for "is this
// apartment/date combo full" instead of four copies of the same query.
async function checkSlotCapacity(apartment, pickupDate) {
  const [[vendorRow]] = await pool.query(
    `SELECT vendor_id FROM apartment_slots WHERE apartment = ? LIMIT 1`,
    [apartment]
  );
  if (!vendorRow) return { available: true };

  const [[capRow]] = await pool.query(
    `SELECT max_orders_per_day FROM vendor_capacity WHERE vendor_id = ? AND apartment = ?`,
    [vendorRow.vendor_id, apartment]
  );
  if (!capRow) return { available: true };

  const [[{ cnt }]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM orders WHERE apartment = ? AND pickup_date = ? AND status != 'cancelled'`,
    [apartment, pickupDate]
  );
  const available = cnt < capRow.max_orders_per_day;
  return {
    available,
    message: available ? null : 'Slot full for selected date, please choose another date',
  };
}

module.exports = { checkSlotCapacity };
