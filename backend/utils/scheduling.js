const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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

module.exports = { addDaysToDateString, weekdayOf, isLeaveDay, skipPastLeaveDay };
