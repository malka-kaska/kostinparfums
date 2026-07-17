import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SocialProof } from "./SocialProof";

describe("SocialProof", () => {
  it("increments likes on Like", () => {
    render(<SocialProof />);
    const before = screen.getByTestId("count").textContent;
    fireEvent.click(screen.getByTestId("like"));
    const after = screen.getByTestId("count").textContent;
    expect(Number(after?.match(/\d+/)?.[0])).toBe(
      Number(before?.match(/\d+/)?.[0]) + 1
    );
  });
});
