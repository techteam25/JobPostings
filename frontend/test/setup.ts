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

// Node's experimental Web Storage is off unless `--localstorage-file` is set,
// so jsdom can boot with `window.localStorage === undefined`. Zustand persist
// then crashes on `setState`. Provide an in-memory stub when the real API is
// missing so filter-store tests can run.
if (
  typeof window !== "undefined" &&
  typeof window.localStorage === "undefined"
) {
  const memory = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, String(value));
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
      clear: () => {
        memory.clear();
      },
      get length() {
        return memory.size;
      },
      key: (index: number) => Array.from(memory.keys())[index] ?? null,
    } satisfies Storage,
  });
}

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

  // Radix Dialog/Sheet/Dropdown can leave scroll-lock on document.body between
  // tests when parallel workers or incomplete unmount timing interfere.
  document.body.removeAttribute("data-scroll-locked");
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
});
