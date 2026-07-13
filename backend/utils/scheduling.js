const pool = require('../db');

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// users.order_block_minutes is provisioned lazily by the admin backend
// (ensureVendorLeaveColumn), only when an admin route actually runs. If
// customer traffic hits a route reading this column before any admin action
// has, it 500s with "Unknown column" - happened live on dev the moment this
// shipped. Don't depend on the admin backend having run first; check here
// too, the same way ensureAuthSchema() doesn't depend on anything else.
let orderBlockColumnEnsured = false;
async function ensureOrderBlockColumn() {
  if (orderBlockColumnEnsured) return;
  const [[col]] = await pool.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'order_block_minutes'`
  );
  if (col.cnt === 0) {
    await pool.query("ALTER TABLE users ADD COLUMN order_block_minutes INT NOT NULL DEFAULT 0");
  }
  orderBlockColumnEnsured = true;
}

// Delivery date = pickup date + the apartment's configured day offset (set by
// admin on the Apartments page). YYYY-MM-DD in, YYYY-MM-DD out — avoids
// timezone drift from constructing a Date at midnight local time.
function addDaysToDateString(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

// Weekday name ("Sunday", ...) for a YYYY-MM-DD string, computed the same
// UTC-anchored way as addDaysToDateString so the two never disagree about
// which calendar day a string represents.
function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

// True if this date string falls on the vendor's weekly full-day leave.
function isLeaveDay(dateStr, vendorLeaveDay) {
  return !!vendorLeaveDay && weekdayOf(dateStr) === vendorLeaveDay;
}

// Push a date forward, day by day, until it's no longer the vendor's leave
// day. Used both for pickup_date validation (should never be needed if the
// frontend blocked it, but the backend doesn't trust that) and for delivery
// dates computed from pickup + offset, which can land on a leave day even
// when pickup_date itself didn't.
function skipPastLeaveDay(dateStr, vendorLeaveDay) {
  let result = dateStr;
  // Bounded loop: a single weekly leave day can only ever require one skip,
  // but loop defensively in case of future multi-day-leave support.
  for (let i = 0; i < 7 && isLeaveDay(result, vendorLeaveDay); i++) {
    result = addDaysToDateString(result, 1);
  }
  return result;
}

// Server runs in UTC but the business (and the "today"/slot-cutoff the
// customer sees) is IST - shift the clock by the fixed +5:30 offset and
// read the UTC fields back as if they were IST wall-clock fields, rather
// than trusting the client to have gotten this right on its own.
function nowIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000);
}

function todayISTDateString() {
  return nowIST().toISOString().slice(0, 10);
}

// Parses a slot string like "5:00 PM – 6:00 PM" and returns the end time in
// minutes-since-midnight (1080 for 6:00 PM), or null if unparseable.
// Mirrors the identical parser in the frontend's OrderPage.jsx.
function parseSlotEndMinutes(slot) {
  if (!slot) return null;
  const parts = slot.split(/\s[–-]\s/);
  if (parts.length < 2) return null;
  const m = parts[parts.length - 1].trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12;
  if (p === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}

// True if pickupDateStr is IST-today AND the current IST time is within
// blockMinutes of the pickup slot's close time - i.e. too late to book
// today, even though the date itself hasn't technically passed yet.
function isPastPickupCutoff(pickupDateStr, timeSlot, blockMinutes) {
  if (pickupDateStr !== todayISTDateString()) return false;
  const end = parseSlotEndMinutes(timeSlot);
  if (end == null) return false;
  const cutoff = end - (blockMinutes || 0);
  const ist = nowIST();
  const curMinutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return curMinutes >= cutoff;
}

module.exports = {
  addDaysToDateString, weekdayOf, isLeaveDay, skipPastLeaveDay,
  todayISTDateString, isPastPickupCutoff, ensureOrderBlockColumn,
};
