import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./mocks/server";

// Server actions in `lib/api/*` call `cookies()` from `next/headers`, which
// doesn't exist in jsdom. Return a no-op cookie store so the action can run
// end-to-end against MSW.
vi.mock("next/headers", () => ({
  cookies: async () => ({
    toString: () => "",
    get: () => undefined,
    getAll: () => [],
    has: () => false,
  }),
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

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

// jsdom doesn't implement the Pointer Capture API that vaul uses.
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

// Vaul (drawer) reads window.matchMedia at mount time. jsdom doesn't ship it,
// so provide a stub that always reports "no match" (i.e., desktop layout).
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  cleanup();
  server.resetHandlers();
});
