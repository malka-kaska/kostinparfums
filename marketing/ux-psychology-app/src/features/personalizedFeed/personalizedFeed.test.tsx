import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PersonalizedFeed } from "./PersonalizedFeed";

describe("PersonalizedFeed", () => {
  it("boosts the liked category to the top", () => {
    render(<PersonalizedFeed />);
    // like the first visible tech card (POOL order: music, sports, tech...)
    const tech = screen.getAllByTestId(/card-tech/)[0];
    const likeBtn = tech.querySelector("button")!;
    fireEvent.click(likeBtn);
    expect(screen.getByTestId("top").textContent).toMatch(/tech/);
  });
});
