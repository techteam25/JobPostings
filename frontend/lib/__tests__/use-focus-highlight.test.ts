import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyFocusHighlight } from "@/lib/use-focus-highlight";

describe("applyFocusHighlight", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a no-op and returns a safe cleanup when the element is null", () => {
    const cleanup = applyFocusHighlight(null);
    expect(() => cleanup()).not.toThrow();
  });

  it("scrolls the element into view and applies the highlight ring", () => {
    const el = document.createElement("div");
    const scrollIntoView = vi.fn();
    el.scrollIntoView = scrollIntoView;
    document.body.appendChild(el);

    applyFocusHighlight(el);

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(el.classList.contains("ring-2")).toBe(true);
    expect(el.classList.contains("ring-ring")).toBe(true);
  });

  it("removes the highlight ring after the duration elapses", () => {
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    applyFocusHighlight(el, 1500);
    expect(el.classList.contains("ring-2")).toBe(true);

    vi.advanceTimersByTime(1500);
    expect(el.classList.contains("ring-2")).toBe(false);
  });

  it("cancels the pending removal and strips classes when cleaned up early", () => {
    const el = document.createElement("div");
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    const cleanup = applyFocusHighlight(el, 1500);
    cleanup();

    expect(el.classList.contains("ring-2")).toBe(false);
  });
});
