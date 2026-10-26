import { toFiniteNumber, toInteger } from "./numbers";

function resolveComparison(comparison) {
  if (!comparison || typeof comparison.deliveryTime !== "string") {
    return null;
  }

  const timestamp = Date.parse(comparison.deliveryTime);

  if (!Number.isFinite(timestamp)) {
    return null;
  }

  let error = toFiniteNumber(comparison.error);

  if (error === null) {
    const forecast = toFiniteNumber(comparison.forecastGeneration);
    const actual = toFiniteNumber(comparison.actualGeneration);

    if (forecast !== null && actual !== null) {
      error = actual - forecast;
    }
  }

  return {
    timestamp,
    comparison: {
      ...comparison,
      error,
      absoluteError:
        error === null ? null : Math.abs(error),
    },
  };
}

export function aggregateAccuracyReports(reports) {
  const comparisonsByTimestamp = new Map();
  let expectedPeriods = 0;

  for (const report of Array.isArray(reports) ? reports : []) {
    expectedPeriods += Math.max(0, toInteger(report?.expectedPeriods) ?? 0);

    for (const comparison of Array.isArray(report?.comparisons)
      ? report.comparisons
      : []) {
      const resolved = resolveComparison(comparison);

      if (resolved) {
        comparisonsByTimestamp.set(resolved.timestamp, resolved.comparison);
      }
    }
  }

  const comparisons = [...comparisonsByTimestamp.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, comparison]) => comparison);
  const errors = comparisons
    .map((comparison) => toFiniteNumber(comparison.error))
    .filter((error) => error !== null);
  const matchedPeriods = errors.length;

  if (matchedPeriods === 0) {
    return {
      matchedPeriods: 0,
      expectedPeriods,
      coveragePercent: 0,
      mae: null,
      rmse: null,
      meanBiasError: null,
      comparisons,
    };
  }

  const absoluteTotal = errors.reduce(
    (total, error) => total + Math.abs(error),
    0,
  );
  const squaredTotal = errors.reduce(
    (total, error) => total + error * error,
    0,
  );
  const errorTotal = errors.reduce((total, error) => total + error, 0);

  return {
    matchedPeriods,
    expectedPeriods,
    coveragePercent:
      expectedPeriods > 0 ? (matchedPeriods / expectedPeriods) * 100 : 0,
    mae: absoluteTotal / matchedPeriods,
    rmse: Math.sqrt(squaredTotal / matchedPeriods),
    meanBiasError: errorTotal / matchedPeriods,
    comparisons,
  };
}

export function mergeRangeForecasts(forecasts) {
  const forecastsByStart = new Map();
  const source = Array.isArray(forecasts) ? forecasts.flat() : [];

  for (const forecast of source) {
    if (!forecast || typeof forecast.startTime !== "string") {
      continue;
    }

    const timestamp = Date.parse(forecast.startTime);

    if (!Number.isFinite(timestamp)) {
      continue;
    }

    const existing = forecastsByStart.get(timestamp);
    const publishTime = Date.parse(forecast.publishTime);

    if (
      !existing ||
      (Number.isFinite(publishTime) &&
        publishTime > Date.parse(existing.publishTime))
    ) {
      forecastsByStart.set(timestamp, forecast);
    }
  }

  return [...forecastsByStart.values()].sort(
    (left, right) => Date.parse(left.startTime) - Date.parse(right.startTime),
  );
}
