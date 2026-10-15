# Implementation Plan — Scroll Affordance for Qualifications Dialogs

## Goal

Help non-technical users realize dialog content is scrollable and scroll it WITHOUT
relying on the native browser scrollbar. Build a reusable `ScrollableArea` component
(bottom gradient fade + clickable "Scroll for more" chevron pill, ambient top fade) and
apply it to the four qualifications dialogs. Verify in a REAL browser with Playwright.

This REPLACES earlier reverted attempts. Do NOT style or force native scrollbars
(no `::-webkit-scrollbar`, no Radix `ScrollArea type="always"`). Repo is clean at
origin/main.

## Design decisions (made during exploration, grounded in the codebase)

- **One reusable component in `components/ui/`.** Matches the task's suggested path and
  the existing shadcn-style convention (plain `React.forwardRef`-free function components,
  `cn()` from `@/lib/utils`, lucide-react icons, Tailwind v4 theme tokens). Note:
  `eslint.config.mts` line 60 ignores `components/ui/**`, so this file is NOT linted —
  it MUST be type-checked via `bunx tsc --noEmit` instead (gate below).
- **Hook lives inside the component file** (`useScrollOverflow`) as the task suggests,
  returning `{ scrollRef, canScrollUp, canScrollDown, scrollDown }`. Keeping it co-located
  avoids adding a public API surface; the repo's shared hooks dir (`hooks/`) uses kebab-case
  (`use-media-query.ts`) if it ever needs extracting, but co-location is cleaner here.
- **Overflow detection via `scrollTop`/`scrollHeight`/`clientHeight`** with a small
  threshold (e.g. 2px) to decide `canScrollUp`/`canScrollDown`. Recompute on mount, on
  `scroll`, and via a single `ResizeObserver` observing BOTH the scroll container and its
  inner content wrapper. This is the standard, framework-free approach and needs no new deps.
- **Fade color uses the theme background token.** `DialogContent` sets `bg-background`
  (see `components/ui/dialog.tsx`), so the fade uses `from-background` → transparent via a
  Tailwind v4 gradient utility, keeping it correct in light/dark (tokens in
  `app/globals.css`).
- **Page-step scroll = 80% of `clientHeight`** via `el.scrollBy({ top, behavior: "smooth" })`,
  falling back to `behavior: "auto"` when `matchMedia("(prefers-reduced-motion: reduce)")`
  matches. The repo already relies on `window.matchMedia` (see `hooks/use-media-query.ts`),
  so this is consistent.
- **Dialog restructuring:** `DialogContent` is `display:grid; gap-4; p-6`. To let the body
  scroll while header/footer stay put, constrain the grid: keep `max-h-[90vh]` on
  `DialogContent`, REMOVE its `overflow-y-auto`, and add `grid-rows-[auto_minmax(0,1fr)_auto]`
  so the middle row (the `ScrollableArea`) can shrink and scroll. Header is row 1, the
  scrollable form-fields body is row 2 (inside `ScrollableArea`), footer is row 3. Footer is
  pinned OUTSIDE the scroll region (better UX). The `<form>` wraps rows 2+3 so submit still
  works; `DialogFooter` keeps its buttons. `minmax(0,1fr)` is required — without the `0` min,
  a grid track won't shrink below content size and nothing scrolls.
- **Playwright auth: use the existing `authenticatedPage` fixture as-is.** Exploration shows
  `e2e/tests/job-application.spec.ts` already uses `authenticatedPage` (default account
  `user_11@example.com`), asserts `toHaveURL("/")`, and navigates to `/me/profile` — i.e.
  the default test user is a JOB-SEEKER that lands on `/`, exactly the account that owns
  `/me/profile/qualifications`. The failing test in the task history used a WRONG import
  path (`./pages/...` instead of `../pages/...`) and is not representative. No new auth path
  or throwaway route is needed. Spec + page object go under `e2e/` matching existing layout
  (`e2e/pages/*.page.ts`, `e2e/tests/*.spec.ts`, importing from `../fixtures`).
- **Overflow vs non-overflow test content:** The Add Work Experience dialog is tall
  (two-column fields + `DynamicRichTextEditor` ~150px + dates + checkbox) and overflows at
  `max-h-[90vh]`; shrinking the Playwright viewport height (e.g. 600px) guarantees overflow.
  For the non-overflow assertion, use a tall viewport (e.g. 1200px) OR the Edit dialog, where
  content fits — assert no affordances render.

## Environment constraints

- A dev server is already running on `localhost:3000`. Playwright's `webServer` config has
  `reuseExistingServer: !CI`, so it will reuse it — do NOT kill/restart :3000.
- Backend must be up for login + `/me/profile/qualifications` data load; the running server
  implies it is. If auth fails in-browser, fall back to the harness route described in
  item 7 (and delete it before finishing).

---

## Plan

- [ ] 1. Create the `ScrollableArea` component and internal `useScrollOverflow` hook.
      Outer `position: relative` wrapper (accepts `className`); inner `div` is the scroll
      container (`overflow-y-auto`, holds a content wrapper around `children`). Hook returns
      `{ scrollRef, contentRef, canScrollUp, canScrollDown, scrollDown }`, computes overflow
      from `scrollTop/scrollHeight/clientHeight` (2px threshold), listens to `scroll`, and
      uses ONE `ResizeObserver` on both the container and content wrapper; cleans up listener
      + observer on unmount. Render: bottom gradient fade (`from-background`, `aria-hidden`,
      `pointer-events-none`) shown only when `canScrollDown`; a real
      `<button type="button" aria-label="Scroll down for more content">` pill
      (lucide `ChevronDown` + "Scroll for more") pinned bottom-center, shown only when
      `canScrollDown`, calling `scrollDown` (scrollBy 80% of clientHeight, smooth unless
      `prefers-reduced-motion: reduce`); top gradient fade (ambient, `aria-hidden`,
      `pointer-events-none`) shown only when `canScrollUp`. No motion/pulse when reduced
      motion. Use `cn()`, `"use client"`. Add stable hooks for tests:
      `data-testid="scroll-affordance-bottom-fade"`, `"scroll-affordance-top-fade"`,
      `"scroll-affordance-button"` and keep inner padding so fades don't clip focus rings.
      Files: `components/ui/scroll-affordance.tsx`
      Verify: `bunx tsc --noEmit` passes (this file is eslint-ignored, so tsc is the gate).

- [ ] 2. Restructure `AddWorkExperienceDialog` to use `ScrollableArea`.
      On `DialogContent`: remove `overflow-y-auto`, keep `max-h-[90vh] max-w-2xl`, add
      `grid-rows-[auto_minmax(0,1fr)_auto]`. Keep `DialogHeader` as-is (row 1). Wrap the
      `<form>` so the array-field body (`form.Field name="workExperiences" mode="array"`
      block incl. "Add Another"/"Remove") sits inside `<ScrollableArea>` (row 2), and
      `DialogFooter` (Cancel + submit) is row 3, OUTSIDE the scroll region but still inside
      the `<form>` so submit fires. Preserve `handleClose` reset-on-close and all array UI.
      Files: `app/(main)/me/profile/qualifications/components/AddWorkExperienceDialog.tsx`
      Verify: `bunx tsc --noEmit` and
      `bunx eslint app/\(main\)/me/profile/qualifications/components/AddWorkExperienceDialog.tsx`
      pass.

- [ ] 3. Apply the identical restructuring pattern to the other three dialogs.
      Same change as item 2 (remove `overflow-y-auto`, add
      `grid-rows-[auto_minmax(0,1fr)_auto]`, wrap the form-fields body in `ScrollableArea`,
      footer as row 3 inside the form). `AddEducationDialog` has the same array UI as the
      work-experience Add dialog; the two Edit dialogs have a single-entry body. Keep
      structure identical across all four.
      Files:
      `app/(main)/me/profile/qualifications/components/AddEducationDialog.tsx`,
      `app/(main)/me/profile/qualifications/components/EditWorkExperienceDialog.tsx`,
      `app/(main)/me/profile/qualifications/components/EditEducationDialog.tsx`
      Verify: `bunx tsc --noEmit` and
      `bunx eslint "app/(main)/me/profile/qualifications/components/AddEducationDialog.tsx" "app/(main)/me/profile/qualifications/components/EditWorkExperienceDialog.tsx" "app/(main)/me/profile/qualifications/components/EditEducationDialog.tsx"`
      pass.

- [ ] 4. Add a Playwright page object for the qualifications page.
      Methods to: `goto("/me/profile/qualifications")`; open the Add Work Experience dialog
      (click the button named `/add work experience/i` — present in both the empty state and
      the populated section, see `WorkExperienceSection.tsx` / `QualificationEmptyState.tsx`);
      expose locators for the dialog, the scroll container (`[data-testid="..."]` from item 1),
      the bottom fade, top fade, and the scroll button; a helper to read the container
      `scrollTop`/`scrollHeight`/`clientHeight` via `evaluate`.
      Files: `e2e/pages/qualifications.page.ts`
      Verify: `bunx tsc --noEmit` passes (compiles with Playwright types).

- [ ] 5. Write the Playwright regression spec with the four required assertions.
      Import `{ test, expect }` from `../fixtures` and use the `authenticatedPage` fixture
      (job-seeker `user_11@example.com`, lands on `/`). Set a short viewport height
      (e.g. `page.setViewportSize({ width: 1000, height: 600 })`) so the Add Work Experience
      dialog overflows. Assertions, with content actually overflowing:
      (1) initially bottom fade + scroll button visible (in DOM, non-zero bounding box),
      top fade NOT visible;
      (2) clicking the scroll button increases container `scrollTop` by a meaningful amount
      (assert delta ≳ 50% of clientHeight);
      (3) after scrolling/clicking to the bottom, bottom fade + button disappear and the top
      fade appears;
      (4) with non-overflowing content (tall viewport e.g. 1200px, or the Edit dialog) none
      of the affordances render.
      Capture at least one screenshot of the chevron+fade over the overflowing dialog saved
      to `.agents/tasks/scroll-affordance/` (e.g.
      `page.screenshot({ path: ".agents/tasks/scroll-affordance/scroll-affordance.png" })`),
      and reference that path in the final report.
      Files: `e2e/tests/qualifications-scrollbar.spec.ts`
      Verify: with the dev server reused on :3000, run
      `bunx playwright test e2e/tests/qualifications-scrollbar.spec.ts --project=chromium`
      — all four assertions pass and the screenshot is written. If auth is flaky, see item 7.

- [ ] 6. (Optional, cheap) Add a WebKit project to cover Safari behavior.
      Add a `webkit` project to `playwright.config.ts` `projects` (`...devices["Desktop Safari"]`)
      and re-run the spec with `--project=webkit`. The user explicitly reported Safari and
      Opera GX issues, so Safari (WebKit) coverage is valuable. If WebKit isn't installed,
      run `bunx playwright install webkit` first.
      Files: `playwright.config.ts`
      Verify: `bunx playwright test e2e/tests/qualifications-scrollbar.spec.ts --project=webkit`
      passes (or document if WebKit binary is unavailable in the environment).

- [ ] 7. Fallback ONLY IF in-browser auth proves unreliable: isolated throwaway harness.
      Create a dev-only route (e.g. `app/(dev)/scroll-harness/page.tsx`) that renders a single
      dialog (or just `ScrollableArea` with tall dummy content) with no auth, point the spec
      at it to satisfy the four assertions + screenshot, THEN DELETE the route before
      finishing. Do NOT leave any dev-only route in the repo. Prefer item 5's authenticated
      path; use this only as a last resort.
      Files (temporary, must be removed): `app/(dev)/scroll-harness/page.tsx`
      Verify: spec passes against the harness; after passing, confirm the route file is deleted
      and `git status` shows no `app/(dev)` artifact.

- [ ] 8. Final gates.
      From `frontend/`, run and make pass:
      - `bunx tsc --noEmit` (covers the eslint-ignored new `components/ui` component too)
      - `bunx eslint "app/(main)/me/profile/qualifications/components/AddWorkExperienceDialog.tsx" "app/(main)/me/profile/qualifications/components/AddEducationDialog.tsx" "app/(main)/me/profile/qualifications/components/EditWorkExperienceDialog.tsx" "app/(main)/me/profile/qualifications/components/EditEducationDialog.tsx" e2e/pages/qualifications.page.ts e2e/tests/qualifications-scrollbar.spec.ts`
        (the four dialog files + new non-ui files; `components/ui/**` is eslint-ignored)
      - the Playwright spec from item 5 (and item 6 if added) green
      Confirm no throwaway route remains and the screenshot exists under
      `.agents/tasks/scroll-affordance/`.
      Verify: all commands above exit 0; report the screenshot path.

## Verification strategy summary

- **Auth path:** existing `authenticatedPage` fixture + default job-seeker `user_11@example.com`
  (proven by `e2e/tests/job-application.spec.ts` which lands on `/` and visits `/me/profile`).
  No new fixture needed. The task-history failure came from a wrong import path, not the auth.
- **Project(s):** `chromium` (required); `webkit`/Safari added if the binary is available
  (user reported Safari + Opera GX).
- **Four assertions:** overflow → bottom fade+button visible & top fade hidden; click →
  scrollTop increases meaningfully; at bottom → bottom affordances gone & top fade shown;
  no-overflow → nothing renders.
- **Screenshot:** saved under `.agents/tasks/scroll-affordance/`, path referenced in the
  final report.
- **No worktree:** edit in place on `main` (clean at origin/main).

## Known gaps / assumptions

- Exact fade sizing/pill styling (height, blur, radius) is left to the implementer within the
  stated constraints (bottom clickable, top ambient, theme background, respects reduced motion).
- If the backend is NOT running when Playwright executes, the authenticated route won't load
  data; item 7's harness is the fallback. The dev server currently on :3000 implies backend is up.
