import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Polyfill APIs missing in jsdom that Radix UI components need
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.PointerEvent = class PointerEvent extends MouseEvent {
  readonly pointerId: number;
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
    this.pointerId = params.pointerId ?? 0;
  }
} as any;

afterEach(() => {
  cleanup();
});
