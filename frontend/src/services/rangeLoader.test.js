import { describe, expect, it, vi } from "vitest";
import { buildDeliveryRange } from "../utils/periods";
import { loadDeliveryRange, RangeLoadError } from "./rangeLoader";

const NOW = new Date("2026-10-26T12:00:00Z");

function reportFor(date) {
  return {
    matchedPeriods: 1,
    expectedPeriods: 24,
    mae: 2,
    rmse: 2,
    meanBiasError: -2,
    coveragePercent: 100 / 24,
    comparisons: [
      {
        deliveryTime: `${date}T00:00:00Z`,
        forecastGeneration: 10,
        actualGeneration: 8,
        error: -2,
        absoluteError: 2,
      },
    ],
  };
}

function forecastsFor(date) {
  return [
    {
      dataset: "WINDFOR",
      publishTime: `${date}T08:50:00Z`,
      startTime: `${date}T00:00:00Z`,
      generation: 10,
    },
  ];
}

function createFetchers(overrides = {}) {
  return {
    fetchForecasts: vi.fn(async (period) => forecastsFor(period.date)),
    fetchAccuracy: vi.fn(async (period) => reportFor(period.date)),
    ...overrides,
  };
}

describe("range loader", () => {
  it("loads one day at a time with both endpoints and reports progress", async () => {
    const period = buildDeliveryRange(
      "2026-10-19",
      "2026-10-21",
      "n2ex",
      NOW,
    );
    const fetchers = createFetchers();
    const onProgress = vi.fn();

    const result = await loadDeliveryRange(period, {
      fetchers,
      onProgress,
    });

    expect(fetchers.fetchForecasts).toHaveBeenCalledTimes(3);
    expect(fetchers.fetchAccuracy).toHaveBeenCalledTimes(3);
    expect(result.daily).toHaveLength(3);
    expect(result.failures).toEqual([]);
    expect(result.report.expectedPeriods).toBe(72);
    expect(result.report.matchedPeriods).toBe(3);
    expect(onProgress).toHaveBeenLastCalledWith({
      completed: 3,
      total: 3,
      loaded: 3,
      failed: 0,
    });
  });

  it("caps day-level concurrency at three", async () => {
    const period = buildDeliveryRange(
      "2026-10-19",
      "2026-10-25",
      "n2ex",
      NOW,
    );
    let activeDays = 0;
    let maxActiveDays = 0;
    const fetchers = createFetchers({
      fetchAccuracy: vi.fn(async (day) => {
        activeDays += 1;
        maxActiveDays = Math.max(maxActiveDays, activeDays);
        await new Promise((resolve) => setTimeout(resolve, 2));
        activeDays -= 1;
        return reportFor(day.date);
      }),
    });

    await loadDeliveryRange(period, { fetchers });

    expect(maxActiveDays).toBe(3);
  });

  it("keeps successful days when one day fails", async () => {
    const period = buildDeliveryRange(
      "2026-10-19",
      "2026-10-21",
      "n2ex",
      NOW,
    );
    const fetchers = createFetchers({
      fetchForecasts: vi.fn(async (day) => {
        if (day.date === "2026-10-20") {
          throw new Error("upstream failed");
        }

        return forecastsFor(day.date);
      }),
    });

    const result = await loadDeliveryRange(period, { fetchers });

    expect(result.daily).toHaveLength(2);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].date).toBe("2026-10-20");
    expect(result.failures[0].error.message).toBe("upstream failed");
    expect(result.report.expectedPeriods).toBe(48);
  });

  it("throws when every day fails", async () => {
    const period = buildDeliveryRange(
      "2026-10-19",
      "2026-10-20",
      "n2ex",
      NOW,
    );
    const fetchers = createFetchers({
      fetchForecasts: vi.fn(async () => {
        throw new Error("offline");
      }),
    });

    await expect(loadDeliveryRange(period, { fetchers })).rejects.toBeInstanceOf(
      RangeLoadError,
    );
  });

  it("retries only failed days by reusing successful cached days", async () => {
    const period = buildDeliveryRange(
      "2026-10-19",
      "2026-10-21",
      "n2ex",
      NOW,
    );
    const cache = new Map();
    const callsByDate = new Map();
    let failOctober20 = true;
    const fetchers = createFetchers({
      fetchForecasts: vi.fn(async (day) => {
        callsByDate.set(
          day.date,
          (callsByDate.get(day.date) ?? 0) + 1,
        );

        if (day.date === "2026-10-20" && failOctober20) {
          throw new Error("temporary");
        }

        return forecastsFor(day.date);
      }),
    });

    const first = await loadDeliveryRange(period, { fetchers, cache });
    expect(first.failures).toHaveLength(1);

    failOctober20 = false;
    const second = await loadDeliveryRange(period, { fetchers, cache });

    expect(second.failures).toEqual([]);
    expect(callsByDate.get("2026-10-19")).toBe(1);
    expect(callsByDate.get("2026-10-20")).toBe(2);
    expect(callsByDate.get("2026-10-21")).toBe(1);
  });

  it("stops before requesting when the signal is already aborted", async () => {
    const period = buildDeliveryRange(
      "2026-10-19",
      "2026-10-20",
      "n2ex",
      NOW,
    );
    const fetchers = createFetchers();
    const controller = new AbortController();
    controller.abort();

    await expect(
      loadDeliveryRange(period, {
        fetchers,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchers.fetchForecasts).not.toHaveBeenCalled();
    expect(fetchers.fetchAccuracy).not.toHaveBeenCalled();
  });
});
