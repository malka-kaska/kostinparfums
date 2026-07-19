import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Notifications } from "./Notifications";

describe("Notifications", () => {
  it("increments and resets the badge", () => {
    render(<Notifications />);
    fireEvent.click(screen.getByTestId("add"));
    fireEvent.click(screen.getByTestId("add"));
    expect(screen.getByTestId("badge").textContent).toBe("2");
    fireEvent.click(screen.getByTestId("read"));
    expect(screen.getByTestId("badge").textContent).toBe("");
  });
});
