const UK_TIME_ZONE = "Europe/London";

const ukPartsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function parseDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function toValidDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getUkDateParts(value = new Date()) {
  const date = toValidDate(value);

  if (!date) {
    return null;
  }

  const parts = ukPartsFormatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

export function getUkDateString(value = new Date()) {
  const parts = getUkDateParts(value);

  if (!parts) {
    return null;
  }

  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(
    2,
    "0",
  )}-${String(parts.day).padStart(2, "0")}`;
}

export function addDays(dateString, days) {
  const parts = parseDateString(dateString);

  if (!parts) {
    return null;
  }

  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );

  return `${String(date.getUTCFullYear()).padStart(4, "0")}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function getUkOffsetMs(value) {
  const date = toValidDate(value);

  if (!date) {
    return null;
  }

  const parts = getUkDateParts(date);
  const seconds = Math.floor(date.getTime() / 1000) * 1000;
  const utcFromParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return utcFromParts - seconds;
}

export function fromUkDateTime(dateString, hour = 0, minute = 0) {
  const parts = parseDateString(dateString);

  if (!parts || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const wallTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    minute,
  );
  let timestamp = wallTime;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getUkOffsetMs(new Date(timestamp));
    const next = wallTime - offset;

    if (next === timestamp) {
      break;
    }

    timestamp = next;
  }

  return new Date(timestamp);
}

export function getUkDayBounds(dateString) {
  const start = fromUkDateTime(dateString, 0, 0);
  const nextDate = addDays(dateString, 1);
  const end = nextDate ? fromUkDateTime(nextDate, 0, 0) : null;

  if (!start || !end) {
    return null;
  }

  return {
    start,
    end,
    startMs: start.getTime(),
    endMs: end.getTime(),
    hours: (end.getTime() - start.getTime()) / (60 * 60 * 1000),
  };
}

export function getUkTodayDate(value = new Date()) {
  return getUkDateString(value);
}

export function getNextUkDeliveryDate(value = new Date()) {
  const today = getUkTodayDate(value);
  return today ? addDays(today, 1) : null;
}
