import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { Scarcity } from "./Scarcity";

describe("Scarcity", () => {
  it("counts down to expired", () => {
    vi.useFakeTimers();
    render(<Scarcity />);
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(screen.getByTestId("timer").textContent).toBe("Offer expired");
    expect((screen.getByTestId("buy") as HTMLButtonElement).disabled).toBe(true);
    vi.useRealTimers();
  });
});
