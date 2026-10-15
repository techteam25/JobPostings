# Non-native scroll affordance for the four qualifications dialogs

A reusable `ScrollableArea` client component replaces reliance on the native browser scrollbar in the Add/Edit Work Experience and Add/Edit Education dialogs. It renders an ambient top fade, a bottom fade, and a real clickable "Scroll for more" pill (chevron) that page-steps the content down, so non-technical users on any browser get a persistent visual cue that content continues below and a way to scroll without a trackpad gesture. Each dialog was restructured to a grid with a fixed header and a scrollable form body, with the footer pinned below the scroll region. Verification shows a genuine Playwright run in Chromium and WebKit covering all four required assertions, plus a saved screenshot of the affordance over an overflowing dialog.

Watch for: nothing blocking. The fade/pill overlay the bottom ~64px of the scrollable content (by design, pointer-events-none on the fade) — confirmed, cosmetic only. The `ScrollOverflowState` ref types use `RefObject<HTMLDivElement>` rather than the nullable form — possible mismatch with current React types, but tsc is reported clean so this is not blocking.

**Verdict**: APPROVED

## High-level view

The design centers on one `components/ui/` component owning its own scroll container plus a co-located `useScrollOverflow` hook. Overflow is derived from `scrollTop/scrollHeight/clientHeight` with a 2px threshold, recomputed on mount, on scroll, and via a single `ResizeObserver` watching both the container and the inner content wrapper, with listener and observer torn down on unmount. This is the framework-free approach the plan called for and it adds no dependencies.

The affordances are gated on overflow direction: the bottom fade and pill appear only when there is content below, the top fade only when there is content above, and nothing renders when content fits. The pill is a real `<button type="button">` with an aria-label; the two fades are `aria-hidden` and `pointer-events-none`. Page-step scrolling moves 80% of the viewport via `scrollBy`, falling back to `behavior: "auto"` under `prefers-reduced-motion`, and the chevron bounce is `motion-safe:` only — so reduced-motion is respected for both scroll and animation.

Integration is identical across all four dialogs: `DialogContent` becomes a two-row grid (`grid-rows-[auto_minmax(0,1fr)]`) with `overflow-y-auto` removed, the header is row 1, and a flex `<form>` fills row 2 holding the `ScrollableArea` (field body) above a pinned `DialogFooter`. This departs from the plan's three-row/footer-outside-form sketch but keeps submit, cancel-with-reset, and the Add-dialog array UI intact, and the verification note documents this as the deliberate final layout.

Verification is real-browser: Chromium and WebKit Playwright runs both green, the four assertions each exercised against live overflow metrics, and a screenshot saved at the required path showing the green pill and bottom fade over the overflowing Add Work Experience dialog. tsc and eslint are reported passing, with `components/ui/**` eslint-ignored and gated by tsc as the plan noted.

<details>
<summary>Issues (2)</summary>

1. **Fade/pill overlay the last field** — the bottom fade (`h-16`) and the `bottom-2` pill sit over the lower ~64px of the scrollable content; the fade is `pointer-events-none` so it doesn't block interaction, and the pill disappears at the bottom. Cosmetic; optionally add bottom padding to the content wrapper so the final field clears the pill. Non-blocking.
2. **Ref type nullability** — `ScrollOverflowState` declares `scrollRef`/`contentRef` as `RefObject<HTMLDivElement>` while `useRef<HTMLDivElement>(null)` yields the nullable form under current React types. tsc is reported clean so this compiles today; worth tightening to `RefObject<HTMLDivElement | null>` if a React types bump surfaces it. Non-blocking.

</details>

<details>
<summary>Details</summary>

### Overflow detection and lifecycle

The content wrapper (`contentRef`) is observed alongside the scroll container by the single `ResizeObserver`, so content-driven height changes the container alone wouldn't surface — the `DynamicRichTextEditor` mounting, or an "Add Another" entry expanding the array — retrigger the measure. That coverage matters for the Add dialogs, where the body grows after mount; a container-only observer would leave the affordance stale in those cases.

### The four assertions

The spec exercises each assertion against live metrics rather than DOM presence alone: it asserts `scrollHeight > clientHeight + 2` before the visibility checks, requires the pill click to raise `scrollTop` by more than 50% of `clientHeight` (polled, matching the 80% page-step), confirms the bottom affordances vanish and the top fade appears after jumping to the bottom, and asserts `scrollHeight <= clientHeight + 2` with nothing visible in the tall-viewport case. `isAffordanceVisible` gates on computed opacity > 0.5 and a non-zero bounding box, so an `opacity-0` affordance that stays in the DOM still reads as not visible. All four passed in Chromium and WebKit per the verification note.

### Accessibility

The reduced-motion path is code-only, not asserted in an automated test — a `matchMedia` branch in `scrollDown` plus the `motion-safe:` chevron bounce, exercised by code path only. The rest (real `<button>` with aria-label and focus-visible ring, `aria-hidden` + `pointer-events-none` on both fades) is covered by the high-level view.

### Dialog restructuring

```
DialogContent  (grid, grid-rows-[auto_minmax(0,1fr)], max-h-[90vh], no overflow-y-auto)
├─ DialogHeader                 row 1 (fixed)
└─ <form> (flex min-h-0 col)    row 2
   ├─ ScrollableArea flex-1     scroll region — fades + pill live here
   │    └─ form fields / array UI
   └─ DialogFooter              pinned below the scroll region, still inside <form>
```

The `minmax(0,1fr)` second track (with the explicit `0` minimum) plus `min-h-0` on the flex form is what lets the row shrink below content and scroll — without them the track grows to fit the form and nothing scrolls. The footer sits inside the `<form>` so submit still fires, but outside `ScrollableArea` so Cancel/Save stay reachable at any scroll position. This differs from the plan's three-row/footer-outside-form variant but is the layout documented in the verification note and is applied identically across all four files. The Add dialogs keep `handleClose` reset-on-close and the full array UI inside the scroll region; the Edit dialogs keep single-entry bodies. No native scrollbar styling was introduced anywhere, matching the hard constraint from the prior failed attempts.

### Test placement, auth, and cleanup

The earlier task-history timeout came from the default `authenticatedPage` account (`user_11`) actually being an employer in the current seed, which redirects away from `/`. The fix adds a `jobSeekerPage` fixture defaulting to `user_45` (a seeded seeker that lands on `/`), overridable via env, consistent with the existing fixtures; the spec and page object follow the existing `e2e/tests` / `e2e/pages` layout. The throwaway probe spec was removed, no `app/(dev)` harness route exists in the tree (confirmed), and the screenshot is at the required path. The WebKit project added to `playwright.config.ts` covers the user's reported Safari issue; Opera GX is Chromium-based and covered by proxy.

tsc `--noEmit` and eslint are reported exit 0 in the verification note, with the eslint-ignored component gated by tsc. Per the review mandate these were not re-run; the evidence is present and specific.

</details>

<details>
<summary>File map</summary>

- `components/ui/scroll-affordance.tsx` — new `ScrollableArea` component + `useScrollOverflow` hook (fades, clickable pill, overflow detection).
- `app/(main)/me/profile/qualifications/components/AddWorkExperienceDialog.tsx` — grid restructure, body wrapped in `ScrollableArea`, array UI preserved.
- `app/(main)/me/profile/qualifications/components/AddEducationDialog.tsx` — same restructure, array UI preserved.
- `app/(main)/me/profile/qualifications/components/EditWorkExperienceDialog.tsx` — same restructure, single-entry body.
- `app/(main)/me/profile/qualifications/components/EditEducationDialog.tsx` — same restructure, single-entry body.
- `e2e/fixtures.ts` — new `jobSeekerPage` fixture (seeker that lands on `/`).
- `e2e/pages/qualifications.page.ts` — new page object with affordance locators and scroll-metric helpers.
- `e2e/tests/qualifications-scrollbar.spec.ts` — regression spec, the four assertions, screenshot capture.
- `playwright.config.ts` — adds a WebKit (Desktop Safari) project.
- `.agents/tasks/scroll-affordance/scroll-affordance.png` — screenshot evidence of pill + fade over overflow.

Full diff: `git diff origin/main`.

</details>
