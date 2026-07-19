import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VariableRewards } from "./VariableRewards";

describe("VariableRewards", () => {
  it("shows a reward and updates stats on open", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // -> small tier
    render(<VariableRewards />);
    fireEvent.click(screen.getByTestId("open"));
    expect(screen.getByTestId("reward").textContent).toMatch(/\+/);
    expect(screen.getByTestId("stats").textContent).toMatch(/Opens: 1/);
    vi.restoreAllMocks();
  });
});
