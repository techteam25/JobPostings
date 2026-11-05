"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const HIGHLIGHT_CLASSES = [
  "ring-2",
  "ring-ring",
  "ring-offset-2",
  "rounded-md",
  "transition-shadow",
];

const HIGHLIGHT_DURATION_MS = 1500;

/**
 * Scrolls `element` into view and applies a temporary highlight ring, removing
 * it after `durationMs`. Returns a cleanup function that cancels the pending
 * removal and strips the highlight classes, suitable for a React effect's
 * teardown. Safe to call with a null element (no-op).
 */
export function applyFocusHighlight(
  element: HTMLElement | null,
  durationMs = HIGHLIGHT_DURATION_MS,
): () => void {
  if (!element) {
    return () => {};
  }

  element.scrollIntoView({ behavior: "smooth", block: "center" });
  element.classList.add(...HIGHLIGHT_CLASSES);

  const timeout = setTimeout(() => {
    element.classList.remove(...HIGHLIGHT_CLASSES);
  }, durationMs);

  return () => {
    clearTimeout(timeout);
    element.classList.remove(...HIGHLIGHT_CLASSES);
  };
}

/**
 * Reads a query param (default `focus`) and, if its value maps to an element
 * id via `idMap`, scrolls that element into view and briefly highlights it.
 * The effect runs client-side only; it is a no-op when the param is absent or
 * the target element is missing.
 */
export function useFocusHighlight(
  idMap: Record<string, string>,
  paramName = "focus",
): void {
  const searchParams = useSearchParams();
  const paramValue = searchParams.get(paramName);

  useEffect(() => {
    if (!paramValue) {
      return;
    }

    const targetId = idMap[paramValue];
    if (!targetId) {
      return;
    }

    const element = document.getElementById(targetId);
    return applyFocusHighlight(element);
    // idMap is defined inline at the call site; depend on its stable param value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramValue]);
}
