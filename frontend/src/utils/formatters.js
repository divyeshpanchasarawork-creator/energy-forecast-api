import { toFiniteNumber } from "./numbers";

const UTC = "UTC";
const UK = "Europe/London";
const NO_DATA = "No data";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: UTC,
});

const ukDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: UK,
});

const ukDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: UK,
  timeZoneName: "short",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: UTC,
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: UTC,
});

const chartRangeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: UTC,
});

const numberFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 1,
});

const metricFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const signedFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "always",
});

function toDate(value) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00.000Z`
    : value;
  const date = new Date(normalized);

  return Number.isFinite(date.getTime()) ? date : null;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : "—";
}

export function formatUkDate(value) {
  const date = toDate(value);
  return date ? ukDateFormatter.format(date) : "—";
}

export function formatUkDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return "—";
  }

  if (!startDate || startDate === endDate) {
    return formatUkDate(startDate ?? endDate);
  }

  if (!endDate) {
    return formatUkDate(startDate);
  }

  return `${formatUkDate(startDate)} – ${formatUkDate(endDate)}`;
}

export function formatChartTime(value, includeDate = false) {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  return includeDate
    ? chartRangeFormatter.format(date)
    : timeFormatter.format(date);
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "—";
}

export function formatUkDateTime(value) {
  const date = toDate(value);
  return date ? ukDateTimeFormatter.format(date) : "—";
}

export function formatUkDateTimeWithUtc(value) {
  const date = toDate(value);

  if (!date) {
    return "—";
  }

  return `${ukDateTimeFormatter.format(date)} · ${timeFormatter.format(
    date,
  )} UTC`;
}

export function formatTime(value) {
  const date = toDate(value);
  return date ? timeFormatter.format(date) : "";
}

export function formatDateTimeUtc(value) {
  const formatted = formatDateTime(value);
  return formatted === "—" ? formatted : `${formatted} UTC`;
}

export function formatNumber(value) {
  const number = toFiniteNumber(value);
  return number === null ? NO_DATA : numberFormatter.format(number);
}

export function formatMetric(value) {
  const number = toFiniteNumber(value);
  return number === null ? NO_DATA : metricFormatter.format(number);
}

export function formatSignedNumber(value) {
  const number = toFiniteNumber(value);

  if (number === null) {
    return NO_DATA;
  }

  if (number === 0) {
    return numberFormatter.format(0);
  }

  return signedFormatter.format(number);
}

export function formatPercent(value) {
  const number = toFiniteNumber(value);
  return number === null ? NO_DATA : `${percentFormatter.format(number)}%`;
}

export { NO_DATA };
