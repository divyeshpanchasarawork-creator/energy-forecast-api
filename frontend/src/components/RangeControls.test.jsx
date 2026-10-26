import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RangeControls from "./RangeControls";

const baseProps = {
  mode: "single",
  deliveryDate: "2026-10-27",
  rangeStart: "2026-10-19",
  rangeEnd: "2026-10-25",
  maxDate: "2026-10-27",
  rangeError: null,
  onModeChange: vi.fn(),
  onDateChange: vi.fn(),
  onRangeStartChange: vi.fn(),
  onRangeEndChange: vi.fn(),
  onUseLastSevenDays: vi.fn(),
};

describe("RangeControls", () => {
  it("renders a single delivery date and switches to range mode", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();

    render(
      <RangeControls {...baseProps} onModeChange={onModeChange} />,
    );

    expect(screen.getByLabelText("Delivery date (UK)")).toHaveValue(
      "2026-10-27",
    );
    expect(
      screen.getByRole("button", { name: "Single day" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Range" }));

    expect(onModeChange).toHaveBeenCalledWith("range");
  });

  it("renders range inputs, validation, and the last-seven-days shortcut", async () => {
    const user = userEvent.setup();
    const onRangeStartChange = vi.fn();
    const onRangeEndChange = vi.fn();
    const onUseLastSevenDays = vi.fn();

    render(
      <RangeControls
        {...baseProps}
        mode="range"
        rangeError="Start date must be on or before end date."
        onRangeStartChange={onRangeStartChange}
        onRangeEndChange={onRangeEndChange}
        onUseLastSevenDays={onUseLastSevenDays}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Start date must be on or before end date.",
    );

    fireEvent.change(screen.getByLabelText("Start date (UK)"), {
      target: { value: "2026-10-20" },
    });
    fireEvent.change(screen.getByLabelText("End date (UK)"), {
      target: { value: "2026-10-24" },
    });

    expect(onRangeStartChange).toHaveBeenCalledWith("2026-10-20");
    expect(onRangeEndChange).toHaveBeenCalledWith("2026-10-24");

    await user.click(
      screen.getByRole("button", { name: "Last 7 completed days" }),
    );

    expect(onUseLastSevenDays).toHaveBeenCalledTimes(1);
  });
});
