"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Threshold (px) used to decide whether the container can still scroll in a
 * given direction. Small buffer avoids sub-pixel rounding keeping affordances
 * visible when the user is effectively at the top/bottom.
 */
const SCROLL_THRESHOLD = 2;

/** Fraction of the visible viewport the pill scrolls per click (page-step). */
const PAGE_STEP_RATIO = 0.8;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface ScrollOverflowState {
  scrollRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  canScrollUp: boolean;
  canScrollDown: boolean;
  scrollDown: () => void;
}

/**
 * Tracks whether a scroll container overflows and in which direction, wiring up
 * a scroll listener plus a single ResizeObserver on both the container and its
 * content wrapper so the state stays correct as content or layout changes.
 */
function useScrollOverflow(): ScrollOverflowState {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = React.useState(false);
  const [canScrollDown, setCanScrollDown] = React.useState(false);

  const recompute = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > SCROLL_THRESHOLD);
    setCanScrollDown(
      scrollTop + clientHeight < scrollHeight - SCROLL_THRESHOLD,
    );
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    recompute();

    el.addEventListener("scroll", recompute, { passive: true });

    const observer = new ResizeObserver(recompute);
    observer.observe(el);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      el.removeEventListener("scroll", recompute);
      observer.disconnect();
    };
  }, [recompute]);

  const scrollDown = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      top: el.clientHeight * PAGE_STEP_RATIO,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  return { scrollRef, contentRef, canScrollUp, canScrollDown, scrollDown };
}

interface ScrollableAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Class names applied to the outer (relative) wrapper. */
  className?: string;
  /** Class names applied to the inner scroll container. */
  viewportClassName?: string;
  children: React.ReactNode;
}

/**
 * Wraps arbitrary scrollable content and renders non-native affordances that
 * help users realize they can scroll:
 *  - a bottom gradient fade + clickable "Scroll for more" pill, shown only when
 *    there is more content below;
 *  - an ambient (non-interactive) top gradient fade, shown only when there is
 *    content above.
 *
 * Nothing renders when the content fits. The component owns its own scroll
 * container (inner div with overflow-y-auto).
 */
export function ScrollableArea({
  className,
  viewportClassName,
  children,
  ...props
}: ScrollableAreaProps) {
  const { scrollRef, contentRef, canScrollUp, canScrollDown, scrollDown } =
    useScrollOverflow();

  return (
    <div className={cn("relative min-h-0", className)} {...props}>
      <div
        ref={scrollRef}
        data-testid="scroll-affordance-viewport"
        className={cn("h-full overflow-y-auto px-1 py-1", viewportClassName)}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {/* Ambient top fade — appears only when content exists above. */}
      <div
        aria-hidden="true"
        data-testid="scroll-affordance-top-fade"
        className={cn(
          "from-background pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b to-transparent transition-opacity duration-200",
          canScrollUp ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Bottom fade — appears only when more content exists below. */}
      <div
        aria-hidden="true"
        data-testid="scroll-affordance-bottom-fade"
        className={cn(
          "from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent transition-opacity duration-200",
          canScrollDown ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Clickable scroll pill — pinned bottom-center, only when scrollable down. */}
      <button
        type="button"
        aria-label="Scroll down for more content"
        data-testid="scroll-affordance-button"
        onClick={scrollDown}
        className={cn(
          "bg-primary text-primary-foreground ring-ring/50 focus-visible:ring-ring absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md ring-1 transition-opacity duration-200 hover:opacity-90 focus-visible:ring-2 focus-visible:outline-none",
          canScrollDown ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ChevronDown className="size-4 motion-safe:animate-bounce" />
        Scroll for more
      </button>
    </div>
  );
}
