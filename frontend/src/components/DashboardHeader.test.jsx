import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardHeader from "./DashboardHeader";
import { buildDeliveryRange } from "../utils/periods";

const baseProps = {
  view: "overview",
  mode: "range",
  deliveryDate: "2026-10-27",
  rangeStart: "2026-10-25",
  rangeEnd: "2026-10-27",
  rangeError: null,
  decisionPreset: "n2ex",
  maxDate: "2026-10-27",
  onModeChange: vi.fn(),
  onDateChange: vi.fn(),
  onRangeStartChange: vi.fn(),
  onRangeEndChange: vi.fn(),
  onUseLastSevenDays: vi.fn(),
  onPresetChange: vi.fn(),
  onRefresh: vi.fn(),
  status: "success",
  lastUpdated: null,
};

describe("DashboardHeader", () => {
  it("summarizes a multi-day range and mixed snapshot state", () => {
    const period = buildDeliveryRange(
      "2026-10-25",
      "2026-10-27",
      "n2ex",
      new Date("2026-10-26T08:00:00Z"),
    );

    render(<DashboardHeader {...baseProps} period={period} />);

    expect(screen.getByText("Delivery range")).toBeInTheDocument();
    expect(
      screen.getByText("25 Oct 2026 – 27 Oct 2026 (UK)"),
    ).toBeInTheDocument();
    expect(screen.getByText("3 days · 73 hours")).toBeInTheDocument();
    expect(screen.getByText("Mixed final + preview")).toBeInTheDocument();
    expect(
      screen.getByText(
        "N2EX day-ahead auction · 09:50 UK cut-off each day",
      ),
    ).toBeInTheDocument();
  });

  it("shows validation without a range summary when dates are invalid", () => {
    render(
      <DashboardHeader
        {...baseProps}
        period={null}
        rangeError="Start date must be on or before end date."
        status="idle"
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Start date must be on or before end date.",
    );
    expect(screen.queryByText("Delivery range")).not.toBeInTheDocument();
  });
});
