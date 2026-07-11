// Delivery date = pickup date + the apartment's configured day offset (set by
// admin on the Apartments page). YYYY-MM-DD in, YYYY-MM-DD out — avoids
// timezone drift from constructing a Date at midnight local time.
function addDaysToDateString(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

module.exports = { addDaysToDateString };
