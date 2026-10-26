import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import RangeWarning from "./RangeWarning";

describe("RangeWarning", () => {
  it("lists failed days and retries only through the callback", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <RangeWarning
        failures={[
          { date: "2026-10-20", error: new Error("failed") },
          { date: "2026-10-21", error: new Error("failed") },
        ]}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "2 days could not be loaded: 20 Oct 2026, 21 Oct 2026.",
    );

    await user.click(
      screen.getByRole("button", { name: "Retry failed days" }),
    );

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
