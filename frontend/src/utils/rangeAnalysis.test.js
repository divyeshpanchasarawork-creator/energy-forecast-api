import { describe, expect, it } from "vitest";
import {
  aggregateAccuracyReports,
  mergeRangeForecasts,
} from "./rangeAnalysis";

function comparison(deliveryTime, forecast, actual) {
  const error = actual - forecast;

  return {
    deliveryTime,
    forecastGeneration: forecast,
    actualGeneration: actual,
    error,
    absoluteError: Math.abs(error),
  };
}

describe("range accuracy aggregation", () => {
  it("aggregates raw comparisons instead of averaging daily metrics", () => {
    const report = aggregateAccuracyReports([
      {
        matchedPeriods: 2,
        expectedPeriods: 2,
        mae: 1.5,
        rmse: Math.sqrt(2.5),
        meanBiasError: -0.5,
        coveragePercent: 100,
        comparisons: [
          comparison("2026-10-20T00:00:00Z", 10, 11),
          comparison("2026-10-20T01:00:00Z", 10, 8),
        ],
      },
      {
        matchedPeriods: 1,
        expectedPeriods: 2,
        mae: 4,
        rmse: 4,
        meanBiasError: 4,
        coveragePercent: 50,
        comparisons: [
          comparison("2026-10-21T00:00:00Z", 10, 14),
        ],
      },
    ]);

    expect(report.matchedPeriods).toBe(3);
    expect(report.expectedPeriods).toBe(4);
    expect(report.coveragePercent).toBe(75);
    expect(report.mae).toBeCloseTo(7 / 3);
    expect(report.rmse).toBeCloseTo(Math.sqrt(21 / 3));
    expect(report.meanBiasError).toBeCloseTo(1);
    expect(report.comparisons).toHaveLength(3);
  });

  it("sorts and deduplicates comparisons, keeping the latest record", () => {
    const report = aggregateAccuracyReports([
      {
        matchedPeriods: 1,
        expectedPeriods: 2,
        comparisons: [
          comparison("2026-10-21T00:00:00Z", 10, 12),
        ],
      },
      {
        matchedPeriods: 1,
        expectedPeriods: 2,
        comparisons: [
          comparison("2026-10-20T00:00:00Z", 10, 11),
          comparison("2026-10-21T00:00:00Z", 10, 13),
        ],
      },
    ]);

    expect(report.comparisons.map((item) => item.deliveryTime)).toEqual([
      "2026-10-20T00:00:00Z",
      "2026-10-21T00:00:00Z",
    ]);
    expect(report.comparisons[1].actualGeneration).toBe(13);
    expect(report.matchedPeriods).toBe(2);
  });

  it("returns no-data metrics when no hours matched", () => {
    const report = aggregateAccuracyReports([
      {
        matchedPeriods: 0,
        expectedPeriods: 24,
        mae: null,
        rmse: null,
        meanBiasError: null,
        coveragePercent: 0,
        comparisons: [],
      },
    ]);

    expect(report.matchedPeriods).toBe(0);
    expect(report.expectedPeriods).toBe(24);
    expect(report.coveragePercent).toBe(0);
    expect(report.mae).toBeNull();
    expect(report.rmse).toBeNull();
    expect(report.meanBiasError).toBeNull();
  });

  it("handles an empty report list", () => {
    expect(aggregateAccuracyReports([])).toEqual({
      matchedPeriods: 0,
      expectedPeriods: 0,
      coveragePercent: 0,
      mae: null,
      rmse: null,
      meanBiasError: null,
      comparisons: [],
    });
  });

  it("merges forecasts in time order without duplicate delivery hours", () => {
    const forecasts = mergeRangeForecasts([
      [
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-20T08:50:00Z",
          startTime: "2026-10-20T00:00:00Z",
          generation: 10,
        },
      ],
      [
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-21T08:50:00Z",
          startTime: "2026-10-21T00:00:00Z",
          generation: 20,
        },
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-20T08:50:00Z",
          startTime: "2026-10-20T00:00:00Z",
          generation: 11,
        },
      ],
      [
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-22T08:50:00Z",
          startTime: "2026-10-20T00:00:00Z",
          generation: 12,
        },
      ],
    ]);

    expect(forecasts.map((item) => item.startTime)).toEqual([
      "2026-10-20T00:00:00Z",
      "2026-10-21T00:00:00Z",
    ]);
    expect(forecasts[0].generation).toBe(12);
  });
});
