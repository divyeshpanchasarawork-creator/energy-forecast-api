import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  fetchForecastAccuracy,
  fetchSelectedForecasts,
  normalizeAccuracyReport,
  normalizeSelectedForecasts,
} from "./energyApi";

const period = {
  publishFrom: "2026-10-23T08:50:00Z",
  decisionTime: "2026-10-25T08:50:00Z",
  deliveryFrom: "2026-10-25T23:00:00Z",
  deliveryTo: "2026-10-26T00:00:00Z",
};

function response(body, init = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "",
    json: vi.fn().mockResolvedValue(body),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("energy API", () => {
  it("normalizes reports and drops malformed rows", () => {
    const report = normalizeAccuracyReport({
      matchedPeriods: "2",
      mae: "12.5",
      rmse: "15",
      meanBiasError: "-1.5",
      expectedPeriods: "25",
      coveragePercent: "8",
      comparisons: [
        {
          deliveryTime: "2026-10-25T23:00:00Z",
          forecastGeneration: "10",
          actualGeneration: "12",
          error: "2",
          absoluteError: "2",
        },
        { deliveryTime: 42 },
        null,
      ],
    });

    expect(report.matchedPeriods).toBe(2);
    expect(report.mae).toBe(12.5);
    expect(report.rmse).toBe(15);
    expect(report.meanBiasError).toBe(-1.5);
    expect(report.expectedPeriods).toBe(25);
    expect(report.coveragePercent).toBe(8);
    expect(report.comparisons).toHaveLength(1);
    expect(report.comparisons[0].forecastGeneration).toBe(10);
  });

  it("normalizes forecasts and drops invalid generations", () => {
    const forecasts = normalizeSelectedForecasts([
      {
        dataset: "WINDFOR",
        publishTime: "2026-10-25T08:30:00Z",
        startTime: "2026-10-25T23:00:00Z",
        generation: "12000",
      },
      {
        publishTime: "2026-10-25T08:30:00Z",
        startTime: "2026-10-26T00:00:00Z",
        generation: "not-a-number",
      },
    ]);

    expect(forecasts).toEqual([
      {
        dataset: "WINDFOR",
        publishTime: "2026-10-25T08:30:00Z",
        startTime: "2026-10-25T23:00:00Z",
        generation: 12000,
      },
    ]);
  });

  it("rejects unexpected response shapes", () => {
    expect(() => normalizeAccuracyReport(null)).toThrow(ApiError);
    expect(() => normalizeSelectedForecasts({})).toThrow(
      "The energy API returned an unexpected forecast response.",
    );
  });

  it("requests accuracy with the exact delivery period", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(response({ comparisons: [], expectedPeriods: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();

    await fetchForecastAccuracy(period, { signal: controller.signal });

    const [url, options] = fetchMock.mock.calls[0];
    const parsed = new URL(url, "http://localhost");
    expect(parsed.pathname).toBe("/api/energy/accuracy");
    expect(Object.fromEntries(parsed.searchParams)).toEqual(period);
    expect(options.method).toBe("GET");
    expect(options.cache).toBe("no-store");
    expect(options.signal).toBe(controller.signal);
  });

  it("requests selected forecasts from the forecast endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchSelectedForecasts(period);

    const parsed = new URL(fetchMock.mock.calls[0][0], "http://localhost");
    expect(parsed.pathname).toBe("/api/energy/forecast/selected");
  });

  it("surfaces backend error messages and status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response(
          { message: "deliveryFrom must be before deliveryTo" },
          { ok: false, status: 400, statusText: "Bad Request" },
        ),
      ),
    );

    await expect(fetchForecastAccuracy(period)).rejects.toMatchObject({
      name: "ApiError",
      message:
        "deliveryFrom must be before deliveryTo (400 Bad Request)",
      status: 400,
    });
  });

  it("rethrows aborts and converts network failures to ApiError", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));

    await expect(fetchForecastAccuracy(period)).rejects.toBe(abortError);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(fetchForecastAccuracy(period)).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
    });
  });
});
