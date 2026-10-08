const TIME_ZONE = "Asia/Dhaka";

function getDhakaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

export function getDhakaTodayString(date = new Date()) {
  const { year, month, day } = getDhakaDateParts(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

export function getDhakaTodayStart(date = new Date()) {
  const { year, month, day } = getDhakaDateParts(date);

  return new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 6 * 60 * 60 * 1000
  );
}

export function getDhakaTodayEnd(date = new Date()) {
  const start = getDhakaTodayStart(date);

  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function addDhakaCalendarMonths(date, months) {
  const { year, month, day } = getDhakaDateParts(date);

  const targetMonthIndex = month - 1 + months;

  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

  const daysInTargetMonth = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0)
  ).getUTCDate();

  const safeDay = Math.min(day, daysInTargetMonth);

  return new Date(
    Date.UTC(targetYear, targetMonth, safeDay, 0, 0, 0, 0) -
      6 * 60 * 60 * 1000
  );
}

export function addDhakaCalendarDays(date, days) {
  const { year, month, day } = getDhakaDateParts(date);

  return new Date(
    Date.UTC(year, month - 1, day + days, 0, 0, 0, 0) -
      6 * 60 * 60 * 1000
  );
}

export function getMembershipStatus(membership, now = new Date()) {
  if (!membership) {
    return "expired";
  }

  const todayStart = getDhakaTodayStart(now);
  const todayEnd = getDhakaTodayEnd(now);

  const startDate = new Date(membership.startDate);
  const expiryDate = new Date(membership.expiryDate);

  if (startDate > todayEnd) {
    return "upcoming";
  }

  if (expiryDate < todayStart) {
    return "expired";
  }

  if (membership.active === false) {
    return "expired";
  }

  return "active";
}

export function getMembershipMonthCode(date = new Date()) {
  const { month } = getDhakaDateParts(date);

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  return months[month - 1];
}