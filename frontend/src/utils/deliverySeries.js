import { toFiniteNumber } from "./numbers";

const HOUR_MS = 60 * 60 * 1000;

function toHourTimestamp(value) {
  if (typeof value !== "string") {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? Math.floor(timestamp / HOUR_MS) * HOUR_MS
    : null;
}

function toExactHourTimestamp(value) {
  const timestamp = toHourTimestamp(value);
  return timestamp !== null && Date.parse(value) === timestamp
    ? timestamp
    : null;
}

export function buildDeliverySeries({ forecasts, report, period }) {
  const comparisons = Array.isArray(report?.comparisons)
    ? report.comparisons
    : [];
  const comparisonsByHour = new Map();

  for (const comparison of comparisons) {
    if (!comparison || typeof comparison !== "object") {
      continue;
    }

    const timestamp = toHourTimestamp(comparison.deliveryTime);

    if (timestamp !== null) {
      comparisonsByHour.set(timestamp, comparison);
    }
  }

  const forecastsByHour = new Map();

  for (const forecast of Array.isArray(forecasts) ? forecasts : []) {
    if (!forecast || typeof forecast !== "object") {
      continue;
    }

    const timestamp = toExactHourTimestamp(forecast.startTime);

    if (timestamp === null) {
      continue;
    }

    const existing = forecastsByHour.get(timestamp);
    const publishTime = Date.parse(forecast.publishTime);

    if (
      !existing ||
      (Number.isFinite(publishTime) &&
        publishTime > Date.parse(existing.publishTime))
    ) {
      forecastsByHour.set(timestamp, forecast);
    }
  }

  const series = [];

  for (
    let timestamp = period.deliveryStartMs;
    timestamp < period.deliveryEndMs;
    timestamp += HOUR_MS
  ) {
    const comparison = comparisonsByHour.get(timestamp) ?? null;
    const selectedForecast = forecastsByHour.get(timestamp) ?? null;
    const forecast =
      selectedForecast?.generation ??
      (comparison ? toFiniteNumber(comparison.forecastGeneration) : null);
    const actual = comparison
      ? toFiniteNumber(comparison.actualGeneration)
      : null;
    let status = "missing";

    if (forecast !== null && actual !== null) {
      status = "matched";
    } else if (forecast !== null) {
      status = "awaiting-actual";
    } else if (actual !== null) {
      status = "actual-only";
    }

    series.push({
      timestamp,
      forecast,
      actual,
      forecastPublishTime: selectedForecast?.publishTime ?? null,
      error: comparison ? toFiniteNumber(comparison.error) : null,
      absoluteError: comparison
        ? toFiniteNumber(comparison.absoluteError)
        : null,
      matched: status === "matched",
      status,
      hasForecast: forecast !== null,
      hasActual: actual !== null,
    });
  }

  return series;
}

export function summarizeDeliverySeries(series) {
  const summary = {
    totalHours: series.length,
    forecastCount: 0,
    actualCount: 0,
    matchedCount: 0,
    awaitingActualCount: 0,
    missingCount: 0,
    latestForecastPublishTime: null,
  };

  for (const point of series) {
    if (point.hasForecast) {
      summary.forecastCount += 1;
    }

    if (point.hasActual) {
      summary.actualCount += 1;
    }

    if (point.status === "matched") {
      summary.matchedCount += 1;
    } else if (point.status === "awaiting-actual") {
      summary.awaitingActualCount += 1;
    } else if (point.status === "missing") {
      summary.missingCount += 1;
    }

    if (point.forecastPublishTime) {
      const publishMs = Date.parse(point.forecastPublishTime);

      if (
        Number.isFinite(publishMs) &&
        (summary.latestForecastPublishTime === null ||
          publishMs > Date.parse(summary.latestForecastPublishTime))
      ) {
        summary.latestForecastPublishTime = point.forecastPublishTime;
      }
    }
  }

  return summary;
}
