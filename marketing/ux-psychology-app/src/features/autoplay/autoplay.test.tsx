import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Autoplay } from "./Autoplay";

describe("Autoplay", () => {
  it("advances to next clip when ended (autoplay on)", () => {
    render(<Autoplay />);
    fireEvent.click(screen.getByTestId("ended"));
    expect(screen.getByTestId("current").textContent).toMatch(/Deep Dive/);
  });

  it("does NOT advance when autoplay is off", () => {
    render(<Autoplay />);
    fireEvent.click(screen.getByTestId("autoplay-toggle"));
    fireEvent.click(screen.getByTestId("ended"));
    expect(screen.getByTestId("current").textContent).toMatch(/Intro/);
  });
});
