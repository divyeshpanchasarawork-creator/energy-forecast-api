import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { loadDeliveryRange } from "./services/rangeLoader";

vi.mock("./services/rangeLoader", () => ({
  loadDeliveryRange: vi.fn(async (period) => ({
    daily: period.days.map((day) => ({
      date: day.date,
      period: day,
      forecasts: [],
      report: {
        matchedPeriods: 0,
        expectedPeriods: day.deliveryHours,
        coveragePercent: 0,
        mae: null,
        rmse: null,
        meanBiasError: null,
        comparisons: [],
      },
    })),
    failures: [],
    loadedDays: period.dayCount,
    totalDays: period.dayCount,
    report: {
      matchedPeriods: 0,
      expectedPeriods: period.deliveryHours,
      coveragePercent: 0,
      mae: null,
      rmse: null,
      meanBiasError: null,
      comparisons: [],
    },
    forecasts: [],
  })),
}));

vi.mock("./pages/WindOverview", () => ({
  default: () => <div>Overview content</div>,
}));

vi.mock("./pages/ForecastAccuracy", () => ({
  default: () => <div>Accuracy content</div>,
}));

describe("App", () => {
  beforeEach(() => {
    vi.mocked(loadDeliveryRange).mockClear();
  });

  it("loads a single day, then the last seven completed days in range mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() =>
      expect(loadDeliveryRange).toHaveBeenCalledTimes(1),
    );
    expect(loadDeliveryRange.mock.calls[0][0].dayCount).toBe(1);
    expect(loadDeliveryRange.mock.calls[0][0].mode).toBe("single");
    expect(await screen.findByText("Overview content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Range" }));

    await waitFor(() =>
      expect(loadDeliveryRange).toHaveBeenCalledTimes(2),
    );

    const rangePeriod = loadDeliveryRange.mock.calls[1][0];
    expect(rangePeriod.dayCount).toBe(7);
    expect(rangePeriod.isRange).toBe(true);
    expect(rangePeriod.mode).toBe("range");
    expect(screen.getByText("Delivery range")).toBeInTheDocument();
  });
});
