import {
  addDays,
  fromUkDateTime,
  getNextUkDeliveryDate,
  getUkDayBounds,
  getUkTodayDate,
} from "./ukTime";

const HOUR_MS = 60 * 60 * 1000;
const PUBLISH_LOOKBACK_HOURS = 48;

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
    cutoffLabel: `${preset.shortLabel} ${preset.timeLabel} UK`,
    deliveryFrom: new Date(deliveryStartMs).toISOString(),
    deliveryTo: new Date(deliveryEndMs).toISOString(),
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
