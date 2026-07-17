import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Streaks } from "./Streaks";

describe("Streaks", () => {
  it("increments on check-in and resets", () => {
    render(<Streaks />);
    fireEvent.click(screen.getByTestId("checkin"));
    fireEvent.click(screen.getByTestId("checkin"));
    expect(screen.getByTestId("streak").textContent).toMatch(/Streak: 2/);
    fireEvent.click(screen.getByTestId("reset"));
    expect(screen.getByTestId("streak").textContent).toMatch(/Streak: 0/);
  });
});
