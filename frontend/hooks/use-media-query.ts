import { useSyncExternalStore } from "react";

/**
 * SSR-safe media query hook using useSyncExternalStore.
 *
 * During server rendering, returns `serverFallback` (default: false).
 * During client hydration, React uses the server snapshot to match
 * the server HTML, then synchronously re-renders with the real value
 * — no hydration mismatch, no visible flash.
 */
export function useMediaQuery(
  query: string,
  serverFallback: boolean = false,
): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}
