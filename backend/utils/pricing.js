const pool = require('../db');

// Thrown for any client-supplied cart problem — callers should respond 400 with .message.
class OrderValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

// Re-prices a cart against the garments table so a client can never dictate its
// own unit_price/quantity/subtotal — only garment_id + quantity are trusted as intent.
async function priceItems(items) {
  if (!Array.isArray(items) || !items.length)
    throw new OrderValidationError('No items provided');

  const garmentIds = [...new Set(items.map(i => Number(i.garment_id)))];
  if (garmentIds.some(id => !Number.isInteger(id) || id <= 0))
    throw new OrderValidationError('Invalid item in cart');

  const placeholders = garmentIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT id, name, price FROM garments WHERE id IN (${placeholders}) AND is_active = 1`,
    garmentIds
  );
  const garmentById = new Map(rows.map(g => [g.id, g]));

  let total = 0;
  const pricedItems = items.map(item => {
    const garment = garmentById.get(Number(item.garment_id));
    if (!garment) throw new OrderValidationError('One or more items are no longer available');

    const quantity = parseInt(item.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50)
      throw new OrderValidationError(`Invalid quantity for ${garment.name}`);

    const unit_price = parseFloat(garment.price);
    const subtotal    = Math.round(unit_price * quantity * 100) / 100;
    total += subtotal;

    return { garment_id: garment.id, garment_name: garment.name, quantity, unit_price, subtotal };
  });

  return { items: pricedItems, total: Math.round(total * 100) / 100 };
}

module.exports = { priceItems, OrderValidationError };
