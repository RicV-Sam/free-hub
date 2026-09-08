function describeBirthdayWindow(window = {}) {
  if (window.kind === "calendar_month") return "Valid during the calendar birthday month";
  if (window.kind === "birthday_week") return "Valid during the birthday week; confirm exact dates with the provider";
  if (window.kind === "three_months") return "Valid for three months from the birthday";
  if (window.beforeDays === 0 && window.afterDays === 0) return "Valid on the actual birthday only";
  if (window.beforeDays === 0 && window.afterDays > 0) return `Valid from the birthday for ${window.afterDays} days`;
  if (window.beforeDays === 7 && window.afterDays === 21) return "Valid from one week before to three weeks after the birthday";
  // Retain the pre-existing calendar-month encoding for older records.
  if (window.beforeDays >= 28 && window.afterDays >= 28) return "Valid during the calendar birthday month";
  return `Valid within ${window.beforeDays} days before and ${window.afterDays} days after the birthday`;
}
module.exports = { describeBirthdayWindow };
