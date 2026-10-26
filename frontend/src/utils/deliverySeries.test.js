import { describe, expect, it } from "vitest";
import { buildDeliveryRange } from "./periods";
import {
  buildDeliverySeries,
  summarizeDeliverySeries,
} from "./deliverySeries";

const NOW = new Date("2026-10-26T12:00:00Z");

function comparison(deliveryTime, forecast, actual) {
  return {
    deliveryTime,
    forecastGeneration: forecast,
    actualGeneration: actual,
    error: actual - forecast,
    absoluteError: Math.abs(actual - forecast),
  };
}

describe("delivery series", () => {
  it("covers a range continuously, including a 25-hour DST day", () => {
    const period = buildDeliveryRange(
      "2026-10-24",
      "2026-10-25",
      "n2ex",
      NOW,
    );
    const series = buildDeliverySeries({
      period,
      forecasts: [
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-23T08:50:00Z",
          startTime: "2026-10-23T23:00:00Z",
          generation: 10,
        },
      ],
      report: {
        comparisons: [
          comparison("2026-10-23T23:00:00Z", 10, 12),
        ],
      },
    });

    expect(series).toHaveLength(49);
    expect(series[0].timestamp).toBe(Date.parse("2026-10-23T23:00:00Z"));
    expect(series[48].timestamp).toBe(Date.parse("2026-10-25T23:00:00Z"));
    expect(series[0].status).toBe("matched");
    expect(series[0].error).toBe(2);
    expect(series[1].status).toBe("missing");
    expect(series[1].forecast).toBeNull();
    expect(series[1].actual).toBeNull();
  });

  it("uses the latest forecast publication for a delivery hour", () => {
    const period = buildDeliveryRange(
      "2026-10-24",
      "2026-10-24",
      "n2ex",
      NOW,
    );
    const series = buildDeliverySeries({
      period,
      forecasts: [
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-23T06:00:00Z",
          startTime: "2026-10-23T23:00:00Z",
          generation: 10,
        },
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-23T08:00:00Z",
          startTime: "2026-10-23T23:00:00Z",
          generation: 15,
        },
      ],
      report: null,
    });

    expect(series[0].forecast).toBe(15);
    expect(series[0].forecastPublishTime).toBe("2026-10-23T08:00:00Z");
    expect(series[0].status).toBe("awaiting-actual");
  });

  it("summarizes matched, awaiting, and missing range hours", () => {
    const period = buildDeliveryRange(
      "2026-10-24",
      "2026-10-24",
      "n2ex",
      NOW,
    );
    const series = buildDeliverySeries({
      period,
      forecasts: [
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-23T08:50:00Z",
          startTime: "2026-10-23T23:00:00Z",
          generation: 10,
        },
        {
          dataset: "WINDFOR",
          publishTime: "2026-10-23T08:50:00Z",
          startTime: "2026-10-24T00:00:00Z",
          generation: 11,
        },
      ],
      report: {
        comparisons: [
          comparison("2026-10-23T23:00:00Z", 10, 12),
        ],
      },
    });
    const summary = summarizeDeliverySeries(series);

    expect(summary.totalHours).toBe(24);
    expect(summary.forecastCount).toBe(2);
    expect(summary.actualCount).toBe(1);
    expect(summary.matchedCount).toBe(1);
    expect(summary.awaitingActualCount).toBe(1);
    expect(summary.missingCount).toBe(22);
    expect(summary.latestForecastPublishTime).toBe(
      "2026-10-23T08:50:00Z",
    );
  });
});
