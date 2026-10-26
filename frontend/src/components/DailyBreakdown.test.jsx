import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DailyBreakdown from "./DailyBreakdown";

describe("DailyBreakdown", () => {
  it("renders one row per loaded delivery day", () => {
    render(
      <DailyBreakdown
        daily={[
          {
            date: "2026-10-24",
            period: { snapshot: "final" },
            report: {
              matchedPeriods: 24,
              expectedPeriods: 24,
              coveragePercent: 100,
              mae: 2.5,
              rmse: 3.25,
              meanBiasError: -1.25,
            },
          },
          {
            date: "2026-10-25",
            period: { snapshot: "preview" },
            report: {
              matchedPeriods: 0,
              expectedPeriods: 25,
              coveragePercent: 0,
              mae: null,
              rmse: null,
              meanBiasError: null,
            },
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Daily breakdown" }),
    ).toBeInTheDocument();
    expect(screen.getByText("24 Oct 2026")).toBeInTheDocument();
    expect(screen.getByText("25 Oct 2026")).toBeInTheDocument();
    expect(screen.getByText("Final")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("100.0%")).toBeInTheDocument();
    expect(screen.getByText("24 of 24")).toBeInTheDocument();
    expect(screen.getByText("2.50")).toBeInTheDocument();
    expect(screen.getByText("3.25")).toBeInTheDocument();
    expect(screen.getByText("-1.25")).toBeInTheDocument();
    expect(screen.getByText("0 of 25")).toBeInTheDocument();
  });

  it("renders nothing when there are no daily rows", () => {
    const { container } = render(<DailyBreakdown daily={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
