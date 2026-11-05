# Verification — Scroll Affordance for Qualifications Dialogs

## What was built

- `components/ui/scroll-affordance.tsx` — reusable `ScrollableArea` client component
  with an internal `useScrollOverflow` hook. Renders:
  - ambient top gradient fade (aria-hidden, pointer-events-none) when content exists above;
  - bottom gradient fade (aria-hidden, pointer-events-none) when more content exists below;
  - a real `<button type="button" aria-label="Scroll down for more content">` pill
    (lucide `ChevronDown` + "Scroll for more") pinned bottom-center, visible only when
    scrollable down; click calls `scrollBy({ top: 80% of clientHeight, behavior })` with
    `behavior: "auto"` under `prefers-reduced-motion: reduce`, else `"smooth"`.
  - Overflow recomputed on mount, on `scroll`, and via a single `ResizeObserver` on both
    the scroll container and the content wrapper; all listeners/observers cleaned up on
    unmount. Chevron bounce is `motion-safe:` only.
  - No native scrollbar styling (no `::-webkit-scrollbar`, no Radix ScrollArea).
  - Fade color uses `from-background` theme token (maps to `--background` in globals.css,
    correct in light/dark).
- Applied identically to the four dialogs. Each `DialogContent` now uses
  `grid grid-rows-[auto_minmax(0,1fr)]` (header = row 1, form = row 2), `overflow-y-auto`
  removed. The `<form>` is a `flex min-h-0 flex-col gap-6`; its field body is wrapped in
  `<ScrollableArea className="flex-1">` (the scrollable region where fades/chevron appear),
  and `DialogFooter` (Cancel + submit) is the last flex child — pinned BELOW the scroll
  region but still inside the `<form>` so submit fires. `handleClose` reset-on-close and the
  "Add Another"/"Remove" array UI in the two Add dialogs are unchanged.

## Final layout decision

Header stays fixed at top; the form-fields body is the scroll region (ScrollableArea);
the Cancel/Save footer is pinned below the scroll region (outside the scrollable area but
inside the `<form>`). Same structure across all four dialogs.

## Commands run and results

### `bunx tsc --noEmit`
Exit 0 (clean). Covers the eslint-ignored `components/ui/scroll-affordance.tsx`.

### `bunx eslint` on the four dialog files + new non-ui files
Files: the 4 dialogs, `e2e/pages/qualifications.page.ts`,
`e2e/tests/qualifications-scrollbar.spec.ts`, `e2e/fixtures.ts`.
Exit 0 (no warnings/errors). `components/ui/**` is eslint-ignored, so the component is
gated by tsc instead.

### Playwright — Chromium
`bunx playwright test e2e/tests/qualifications-scrollbar.spec.ts --project=chromium --reporter=list --timeout=60000 --workers=1`
Result: `2 passed (3.5s)`.

### Playwright — WebKit (Safari coverage; user reported Safari + Opera GX)
`bunx playwright test e2e/tests/qualifications-scrollbar.spec.ts --project=webkit --reporter=list --timeout=60000 --workers=1`
Result: `2 passed (4.4s)`. (`bunx playwright install webkit` run first.)

## The four required browser assertions (all passed, in a real browser)

Against the Add Work Experience dialog with content actually overflowing (viewport
1000x600):

1. Initially the bottom fade + "Scroll for more" chevron are visible (in DOM, opacity > 0.5,
   non-zero bounding box) and the top fade is NOT visible. PASS.
   (Overflow confirmed first: `scrollHeight > clientHeight + 2`.)
2. Clicking the chevron increases the scroll container `scrollTop` by more than 50% of
   `clientHeight` (page-step down). PASS (polled).
3. After scrolling to the bottom, the bottom fade + chevron disappear and the top fade
   appears. PASS (polled).
4. With non-overflowing content (viewport 1000x1400) none of the affordances render
   (`scrollHeight <= clientHeight + 2`; bottom fade, chevron, top fade all not visible). PASS.

## Screenshot evidence

`.agents/tasks/scroll-affordance/scroll-affordance.png` — captured in the Chromium run,
shows the green "Scroll for more" chevron pill and the bottom fade over the overflowing
Add Work Experience dialog, header pinned at top, Cancel/Save footer pinned below.

## Auth path used

The default `authenticatedPage` fixture account (`user_11@example.com`) is actually an
EMPLOYER in the current seed data (redirects to `/employer/organizations/2`), which is why
the earlier task-history run timed out on `waitForURL("/")`. Investigation of
`backend/src/db/db-seed.ts` showed users 1-10 become org owners and 11-40 become org
members (all flipped to `intent: "employer"`); users 41-50 remain job-seekers. Verified
empirically with a throwaway probe spec that `user_41/45/48/50` all land on `/`.

Added a `jobSeekerPage` fixture to `e2e/fixtures.ts` (default `user_45@example.com`,
overridable via `TEST_SEEKER_EMAIL`/`TEST_SEEKER_PASSWORD`) that logs in and waits for `/`,
consistent with the existing `authenticatedPage`/`employerPage` fixtures. The spec uses
this fixture. The throwaway probe spec was deleted. No dev-only route or harness was needed
or left behind.

## Cleanup

- Throwaway probe spec removed (`e2e/tests/_probe.spec.ts`, `/tmp/probe.spec.ts`).
- `test-results/`, `playwright-report/`, and a stale untracked `e2e/artifacts/` directory
  (leftover from the reverted earlier attempts) removed.
- No `app/(dev)` route exists.

## Not verified / notes

- Dev server was reused on `localhost:3000` (reuseExistingServer); backend was up (login +
  qualifications data loaded, dialog showed 4 seeded work experiences).
- Opera GX specifically was not driven (Playwright has no Opera engine); Opera GX is
  Chromium-based so the Chromium project is representative. Safari is covered via WebKit.
- `prefers-reduced-motion` fallback is implemented but not asserted in an automated test;
  it is exercised by code path only.
