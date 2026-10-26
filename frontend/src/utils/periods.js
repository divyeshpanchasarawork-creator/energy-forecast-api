import {
  addDays,
  fromUkDateTime,
  getNextUkDeliveryDate,
  getUkDayBounds,
  getUkTodayDate,
} from "./ukTime";

const HOUR_MS = 60 * 60 * 1000;
const PUBLISH_LOOKBACK_HOURS = 48;
const DAY_MS = 24 * HOUR_MS;

export const MAX_RANGE_DAYS = 7;

export const DECISION_PRESETS = Object.freeze({
  epex: Object.freeze({
    key: "epex",
    shortLabel: "EPEX GB",
    label: "EPEX GB 09:20 UK",
    timeLabel: "09:20",
    hour: 9,
    minute: 20,
    auction: "EPEX GB 60-minute auction",
  }),
  n2ex: Object.freeze({
    key: "n2ex",
    shortLabel: "N2EX",
    label: "N2EX 09:50 UK",
    timeLabel: "09:50",
    hour: 9,
    minute: 50,
    auction: "N2EX day-ahead auction",
  }),
});

export const DEFAULT_DECISION_PRESET = "n2ex";

function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function isValidDeliveryDate(value) {
  return isValidDateString(value);
}

export function getDefaultDeliveryDate(now = new Date()) {
  return getNextUkDeliveryDate(now);
}

export function getMaxDeliveryDate(now = new Date()) {
  return getNextUkDeliveryDate(now);
}

export function buildDeliveryPeriod(
  dateString,
  presetKey = DEFAULT_DECISION_PRESET,
  now = new Date(),
) {
  const safeNow = Number.isFinite(now?.getTime?.()) ? now : new Date();
  const date = isValidDeliveryDate(dateString)
    ? dateString
    : getDefaultDeliveryDate(safeNow);
  const preset =
    DECISION_PRESETS[presetKey] ?? DECISION_PRESETS[DEFAULT_DECISION_PRESET];
  const bounds = getUkDayBounds(date);
  const previousDate = addDays(date, -1);
  const targetCutoff = previousDate
    ? fromUkDateTime(previousDate, preset.hour, preset.minute)
    : null;

  const deliveryStartMs = bounds?.startMs ?? Date.parse(`${date}T00:00:00Z`);
  const deliveryEndMs =
    bounds?.endMs ?? deliveryStartMs + 24 * HOUR_MS;
  const targetCutoffMs = targetCutoff?.getTime() ?? deliveryStartMs;
  const isPreview = safeNow.getTime() < targetCutoffMs;
  const effectiveDecision = isPreview ? safeNow : targetCutoff;
  const effectiveDecisionMs = effectiveDecision?.getTime() ?? targetCutoffMs;
  const decisionTime = new Date(effectiveDecisionMs).toISOString();

  return {
    key: `${date}|${preset.key}|${decisionTime}`,
    date,
    startDate: date,
    endDate: date,
    dayCount: 1,
    mode: "single",
    isRange: false,
    preset,
    presetKey: preset.key,
    deliveryStartMs,
    deliveryEndMs,
    deliveryHours: (deliveryEndMs - deliveryStartMs) / HOUR_MS,
    publishFrom: new Date(
      effectiveDecisionMs - PUBLISH_LOOKBACK_HOURS * HOUR_MS,
    ).toISOString(),
    decisionTime,
    targetCutoff: targetCutoff?.toISOString() ?? null,
    isPreview,
    snapshot: isPreview ? "preview" : "final",
    hasMixedSnapshot: false,
    cutoffLabel: `${preset.shortLabel} ${preset.timeLabel} UK`,
    deliveryFrom: new Date(deliveryStartMs).toISOString(),
    deliveryTo: new Date(deliveryEndMs).toISOString(),
  };
}

export function getRangeDayCount(startDate, endDate) {
  if (
    !isValidDeliveryDate(startDate) ||
    !isValidDeliveryDate(endDate) ||
    startDate > endDate
  ) {
    return 0;
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  return (
    (Date.UTC(endYear, endMonth - 1, endDay) -
      Date.UTC(startYear, startMonth - 1, startDay)) /
      DAY_MS +
    1
  );
}

export function getDefaultDeliveryRange(now = new Date()) {
  const today = getUkTodayDate(now);
  const endDate = today ? addDays(today, -1) : null;
  const startDate = endDate ? addDays(endDate, -(MAX_RANGE_DAYS - 1)) : null;

  return startDate && endDate ? { startDate, endDate } : null;
}

export function validateDeliveryRange(
  startDate,
  endDate,
  now = new Date(),
) {
  if (!isValidDeliveryDate(startDate) || !isValidDeliveryDate(endDate)) {
    return "Choose a valid start and end delivery date.";
  }

  if (startDate > endDate) {
    return "Start date must be on or before end date.";
  }

  const maxDate = getMaxDeliveryDate(now);

  if (maxDate && endDate > maxDate) {
    return "End date cannot be later than the next UK delivery day.";
  }

  if (getRangeDayCount(startDate, endDate) > MAX_RANGE_DAYS) {
    return "Choose a range of 7 delivery days or fewer.";
  }

  return null;
}

export function buildDeliveryRange(
  startDate,
  endDate,
  presetKey = DEFAULT_DECISION_PRESET,
  now = new Date(),
  mode = "range",
) {
  const count = getRangeDayCount(startDate, endDate);

  if (count < 1 || count > MAX_RANGE_DAYS) {
    return null;
  }

  const days = [];
  let cursor = startDate;

  for (let index = 0; index < count; index += 1) {
    days.push(buildDeliveryPeriod(cursor, presetKey, now));
    cursor = addDays(cursor, 1);
  }

  const preset =
    DECISION_PRESETS[presetKey] ?? DECISION_PRESETS[DEFAULT_DECISION_PRESET];
  const first = days[0];
  const last = days[days.length - 1];
  const previewDays = days.filter((day) => day.snapshot === "preview");
  const finalDays = days.filter((day) => day.snapshot === "final");
  let snapshot = "final";

  if (previewDays.length === days.length) {
    snapshot = "preview";
  } else if (previewDays.length > 0 && finalDays.length > 0) {
    snapshot = "mixed";
  }

  const latestDecision = days.reduce(
    (latest, day) =>
      Date.parse(day.decisionTime) > Date.parse(latest.decisionTime)
        ? day
        : latest,
    first,
  );
  const earliestPublish = days.reduce(
    (earliest, day) =>
      Date.parse(day.publishFrom) < Date.parse(earliest.publishFrom)
        ? day
        : earliest,
    first,
  );
  const isRange = mode === "range" && days.length > 1;

  return {
    key: `${mode}|${startDate}|${endDate}|${preset.key}|${days
      .map((day) => day.decisionTime)
      .join(",")}`,
    date: isRange ? endDate : startDate,
    startDate,
    endDate,
    dayCount: days.length,
    days,
    mode,
    isRange,
    preset,
    presetKey: preset.key,
    deliveryStartMs: first.deliveryStartMs,
    deliveryEndMs: last.deliveryEndMs,
    deliveryHours: days.reduce((total, day) => total + day.deliveryHours, 0),
    publishFrom: earliestPublish.publishFrom,
    decisionTime: latestDecision.decisionTime,
    targetCutoff: last.targetCutoff,
    targetCutoffs: days.map((day) => day.targetCutoff),
    isPreview: snapshot !== "final",
    snapshot,
    hasMixedSnapshot: snapshot === "mixed",
    cutoffLabel: `${preset.shortLabel} ${preset.timeLabel} UK each day`,
    deliveryFrom: first.deliveryFrom,
    deliveryTo: last.deliveryTo,
  };
}

export function getPeriodKind(dateString, now = new Date()) {
  const today = getUkTodayDate(now);
  const nextDeliveryDay = today ? addDays(today, 1) : null;

  if (dateString === nextDeliveryDay) {
    return "Next delivery day";
  }

  if (dateString === today) {
    return "Current delivery day";
  }

  if (today && dateString < today) {
    return "Historical day";
  }

  if (today && dateString > today) {
    return "Future delivery";
  }

  return "Delivery day";
}

export function getRangeKind(startDate, endDate, now = new Date()) {
  if (!isValidDeliveryDate(startDate) || !isValidDeliveryDate(endDate)) {
    return "Delivery range";
  }

  if (startDate === endDate) {
    return getPeriodKind(startDate, now);
  }

  const today = getUkTodayDate(now);
  const nextDeliveryDay = today ? addDays(today, 1) : null;

  if (!today) {
    return "Delivery range";
  }

  if (endDate < today) {
    return "Historical range";
  }

  if (startDate > today) {
    return "Future range";
  }

  if (endDate === nextDeliveryDay) {
    return "Includes next delivery day";
  }

  return "Includes current day";
}
