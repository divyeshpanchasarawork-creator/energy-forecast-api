import { describe, expect, it } from "vitest";
import {
  buildDeliveryPeriod,
  buildDeliveryRange,
  getDefaultDeliveryRange,
  getRangeDayCount,
  getRangeKind,
  MAX_RANGE_DAYS,
  validateDeliveryRange,
} from "./periods";

const NOW = new Date("2026-10-26T12:00:00Z");

describe("delivery ranges", () => {
  it("returns the last seven completed UK delivery days by default", () => {
    expect(getDefaultDeliveryRange(NOW)).toEqual({
      startDate: "2026-10-19",
      endDate: "2026-10-25",
    });
  });

  it("builds one period per delivery day with independent cutoffs", () => {
    const range = buildDeliveryRange(
      "2026-10-19",
      "2026-10-25",
      "n2ex",
      NOW,
    );

    expect(range.days).toHaveLength(7);
    expect(range.dayCount).toBe(7);
    expect(range.deliveryHours).toBe(169);
    expect(range.snapshot).toBe("final");
    expect(range.days.every((day) => day.snapshot === "final")).toBe(true);
    expect(range.days[0].targetCutoff).toBe("2026-10-18T08:50:00.000Z");
    expect(range.days[6].targetCutoff).toBe("2026-10-24T08:50:00.000Z");
  });

  it("includes the 25-hour UK day when clocks go back", () => {
    const range = buildDeliveryRange(
      "2026-10-25",
      "2026-10-25",
      "n2ex",
      NOW,
    );

    expect(range.deliveryHours).toBe(25);
    expect(range.deliveryStartMs).toBe(Date.parse("2026-10-24T23:00:00Z"));
    expect(range.deliveryEndMs).toBe(Date.parse("2026-10-26T00:00:00Z"));
  });

  it("includes the 23-hour UK day when clocks go forward", () => {
    const range = buildDeliveryRange(
      "2026-03-29",
      "2026-03-29",
      "n2ex",
      NOW,
    );

    expect(range.deliveryHours).toBe(23);
    expect(range.deliveryStartMs).toBe(Date.parse("2026-03-29T00:00:00Z"));
    expect(range.deliveryEndMs).toBe(Date.parse("2026-03-29T23:00:00Z"));
  });

  it("marks a range ending on the next delivery day as mixed before its cutoff", () => {
    const beforeCutoff = new Date("2026-10-26T08:00:00Z");
    const range = buildDeliveryRange(
      "2026-10-25",
      "2026-10-27",
      "n2ex",
      beforeCutoff,
    );

    expect(range.snapshot).toBe("mixed");
    expect(range.hasMixedSnapshot).toBe(true);
    expect(range.days[0].snapshot).toBe("final");
    expect(range.days[1].snapshot).toBe("final");
    expect(range.days[2].snapshot).toBe("preview");
    expect(range.days[2].decisionTime).toBe(beforeCutoff.toISOString());
  });

  it("marks every day final after the final day's cutoff", () => {
    const range = buildDeliveryRange(
      "2026-10-25",
      "2026-10-27",
      "n2ex",
      new Date("2026-10-26T12:00:00Z"),
    );

    expect(range.snapshot).toBe("final");
    expect(range.hasMixedSnapshot).toBe(false);
  });

  it("keeps single-day delivery periods compatible", () => {
    const period = buildDeliveryPeriod("2026-10-25", "epex", NOW);

    expect(period.dayCount).toBe(1);
    expect(period.startDate).toBe("2026-10-25");
    expect(period.endDate).toBe("2026-10-25");
    expect(period.deliveryHours).toBe(25);
    expect(period.snapshot).toBe("final");
  });

  it("rejects reversed, oversized, and future ranges", () => {
    expect(validateDeliveryRange("2026-10-25", "2026-10-24", NOW)).toBe(
      "Start date must be on or before end date.",
    );
    expect(validateDeliveryRange("2026-10-19", "2026-10-26", NOW)).toBe(
      "Choose a range of 7 delivery days or fewer.",
    );
    expect(validateDeliveryRange("2026-10-26", "2026-10-28", NOW)).toBe(
      "End date cannot be later than the next UK delivery day.",
    );
    expect(validateDeliveryRange("not-a-date", "2026-10-25", NOW)).toBe(
      "Choose a valid start and end delivery date.",
    );
  });

  it("counts inclusive delivery days and accepts a seven-day range", () => {
    expect(getRangeDayCount("2026-10-19", "2026-10-25")).toBe(7);
    expect(MAX_RANGE_DAYS).toBe(7);
    expect(validateDeliveryRange("2026-10-19", "2026-10-25", NOW)).toBeNull();
    expect(validateDeliveryRange("2026-10-25", "2026-10-25", NOW)).toBeNull();
  });

  it("labels historical, current, and next-day ranges", () => {
    expect(getRangeKind("2026-10-19", "2026-10-25", NOW)).toBe(
      "Historical range",
    );
    expect(getRangeKind("2026-10-24", "2026-10-26", NOW)).toBe(
      "Includes current day",
    );
    expect(getRangeKind("2026-10-27", "2026-10-27", NOW)).toBe(
      "Next delivery day",
    );
  });
});
