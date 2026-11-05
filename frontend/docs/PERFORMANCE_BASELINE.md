# Core Web Vitals Baseline

**Date:** 2026-03-17
**Branch:** `william/architecture-refactoring`
**Next.js:** 16.1.6 | **React:** 18.3.1

## Measurement Method

- Library: `web-vitals@5.1.0` via `WebVitalsReporter` component
- Metrics: LCP, INP, CLS, FCP, TTFB
- Bundle analysis: `@next/bundle-analyzer` with `ANALYZE=true`

## Baseline Metrics

Metrics to be captured on first dev/production run after infrastructure is wired up.

| Page | LCP (ms) | INP (ms) | CLS | FCP (ms) | TTFB (ms) |
|------|----------|----------|-----|----------|-----------|
| `/` (Job Listings) | — | — | — | — | — |
| `/sign-in` | — | — | — | — | — |
| `/saved` | — | — | — | — | — |
| `/employer/organizations/[id]` | — | — | — | — | — |

## Post-Optimization Metrics

To be measured after Tasks 1050-1052 are complete.

| Page | LCP (ms) | INP (ms) | CLS | FCP (ms) | TTFB (ms) |
|------|----------|----------|-----|----------|-----------|
| `/` (Job Listings) | — | — | — | — | — |
| `/sign-in` | — | — | — | — | — |
| `/saved` | — | — | — | — | — |
| `/employer/organizations/[id]` | — | — | — | — | — |

## Bundle Analysis

Run `ANALYZE=true bun run build` to generate the bundle report.

| Metric | Value |
|--------|-------|
| Total JS (First Load) | — |
| Largest chunk | — |
| Notable findings | — |
