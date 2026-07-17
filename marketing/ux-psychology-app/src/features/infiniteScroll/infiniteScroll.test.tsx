import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { InfiniteScroll } from "./InfiniteScroll";

function getObserver(): any {
  const mock = (globalThis as any).IntersectionObserver.mock;
  return mock.instances[mock.instances.length - 1];
}

describe("InfiniteScroll", () => {
  beforeEach(() => {
    vi.useRealTimers();
    const mock = (globalThis as any).IntersectionObserver.mock;
    if (mock) mock.instances = [];
  });

  it("renders initial items", () => {
    render(<InfiniteScroll />);
    expect(screen.getByTestId("count").textContent).toMatch(/Loaded: 10/);
  });

  it("loads more when sentinel intersects", async () => {
    vi.useFakeTimers();
    render(<InfiniteScroll />);
    const obs = getObserver();
    act(() => {
      obs.callback([{ isIntersecting: true } as any]);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.getByTestId("count").textContent).toMatch(/Loaded: 20/);
    vi.useRealTimers();
  });
});
