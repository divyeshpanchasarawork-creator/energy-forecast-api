import {
  fetchForecastAccuracy,
  fetchSelectedForecasts,
} from "./energyApi";
import {
  aggregateAccuracyReports,
  mergeRangeForecasts,
} from "../utils/rangeAnalysis";

const DEFAULT_CONCURRENCY = 3;

export class RangeLoadError extends Error {
  constructor(message, failures = []) {
    super(message);
    this.name = "RangeLoadError";
    this.failures = failures;
  }
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ERR_CANCELED";
}

function abortError(signal) {
  if (signal?.reason instanceof Error) {
    return signal.reason;
  }

  const error = new Error("The delivery range request was cancelled.");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw abortError(signal);
  }
}

async function loadDay(day, { signal, fetchers }) {
  throwIfAborted(signal);
  const [forecasts, report] = await Promise.all([
    fetchers.fetchForecasts(day, { signal }),
    fetchers.fetchAccuracy(day, { signal }),
  ]);
  throwIfAborted(signal);
  return { forecasts, report };
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, limit), items.length);

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index], index);
      }
    }),
  );

  return results;
}

export async function loadDeliveryRange(
  period,
  {
    signal,
    cache = new Map(),
    fetchers = {
      fetchForecasts: fetchSelectedForecasts,
      fetchAccuracy: fetchForecastAccuracy,
    },
    concurrency = DEFAULT_CONCURRENCY,
    onProgress,
  } = {},
) {
  throwIfAborted(signal);
  const days = Array.isArray(period?.days) ? period.days : [];

  if (days.length === 0) {
    throw new RangeLoadError("No delivery days were selected.");
  }

  let completed = 0;
  let loaded = 0;
  let failed = 0;

  const results = await mapWithConcurrency(
    days,
    concurrency,
    async (day) => {
      throwIfAborted(signal);

      try {
        const canUseCache = !day.isPreview && cache.has(day.key);
        const value = canUseCache
          ? cache.get(day.key)
          : await loadDay(day, { signal, fetchers });

        if (!canUseCache && !day.isPreview) {
          cache.set(day.key, value);
        }

        completed += 1;
        loaded += 1;
        onProgress?.({ completed, total: days.length, loaded, failed });

        return {
          status: "success",
          day,
          forecasts: value.forecasts,
          report: value.report,
        };
      } catch (error) {
        if (isAbortError(error) || signal?.aborted) {
          throw abortError(signal);
        }

        completed += 1;
        failed += 1;
        onProgress?.({ completed, total: days.length, loaded, failed });

        return {
          status: "failure",
          day,
          date: day.date,
          error,
        };
      }
    },
  );

  throwIfAborted(signal);

  const successes = results.filter((result) => result.status === "success");
  const failures = results
    .filter((result) => result.status === "failure")
    .map(({ date, error }) => ({ date, error }));

  if (successes.length === 0) {
    throw new RangeLoadError(
      "Could not load any days in the selected range.",
      failures,
    );
  }

  const daily = successes.map((result) => ({
    date: result.day.date,
    period: result.day,
    forecasts: result.forecasts,
    report: result.report,
  }));

  return {
    daily,
    failures,
    loadedDays: daily.length,
    totalDays: days.length,
    report: aggregateAccuracyReports(
      daily.map((entry) => entry.report),
    ),
    forecasts: mergeRangeForecasts(
      daily.map((entry) => entry.forecasts),
    ),
  };
}
