import { metrics, type Counter, type Histogram } from "@opentelemetry/api";

/**
 * Hand-instrumented v1 metrics (US 565 / Task 1269).
 *
 * Cardinality rule: no user-id labels on any metric.
 *
 * Lazy initialization: instruments are created on first use. This avoids
 * the module-load timing trap where `meter.createCounter()` executed
 * before `NodeSDK.start()` registers the MeterProvider returns a no-op
 * counter that's permanently detached — observable gauges registered at
 * runtime (inside queueService.initialize) work fine, but module-scope
 * counters silently drop writes. Lazy creation sidesteps that.
 *
 * When OTEL_ENABLED=false the global MeterProvider is a no-op; every
 * instrument here becomes a zero-cost stub.
 */

function getMeter() {
  return metrics.getMeter("jobpostings-backend", "1.0.0");
}

// ─── Audit ───────────────────────────────────────────────────────────
let _auditEventsEmittedTotal: Counter | undefined;
export const auditEventsEmittedTotal: Counter = {
  add: (value, attrs) => {
    _auditEventsEmittedTotal ??= getMeter().createCounter(
      "audit_events_emitted_total",
      { description: "Count of audit events emitted by PinoAuditAdapter" },
    );
    _auditEventsEmittedTotal.add(value, attrs);
  },
} as Counter;

// ─── Auth ────────────────────────────────────────────────────────────
let _authSigninTotal: Counter | undefined;
export const authSigninTotal: Counter = {
  add: (value, attrs) => {
    _authSigninTotal ??= getMeter().createCounter("auth_signin_total", {
      description:
        "Count of sign-in attempts (labels: method, outcome, provider)",
    });
    _authSigninTotal.add(value, attrs);
  },
} as Counter;

let _authSignupTotal: Counter | undefined;
export const authSignupTotal: Counter = {
  add: (value, attrs) => {
    _authSignupTotal ??= getMeter().createCounter("auth_signup_total", {
      description: "Count of sign-up attempts (labels: method, outcome)",
    });
    _authSignupTotal.add(value, attrs);
  },
} as Counter;

// ─── Queue (BullMQ) ──────────────────────────────────────────────────
let _queueJobTotal: Counter | undefined;
export const queueJobTotal: Counter = {
  add: (value, attrs) => {
    _queueJobTotal ??= getMeter().createCounter("queue_job_total", {
      description: "Count of processed BullMQ jobs (labels: queue, outcome)",
    });
    _queueJobTotal.add(value, attrs);
  },
} as Counter;

let _queueJobDurationSeconds: Histogram | undefined;
export const queueJobDurationSeconds: Histogram = {
  record: (value, attrs) => {
    _queueJobDurationSeconds ??= getMeter().createHistogram(
      "queue_job_duration_seconds",
      {
        description:
          "BullMQ job processing duration in seconds (labels: queue)",
        unit: "s",
      },
    );
    _queueJobDurationSeconds.record(value, attrs);
  },
} as Histogram;

// ─── Rate limiter ────────────────────────────────────────────────────
let _rateLimitBlocksTotal: Counter | undefined;
export const rateLimitBlocksTotal: Counter = {
  add: (value, attrs) => {
    _rateLimitBlocksTotal ??= getMeter().createCounter(
      "rate_limit_blocks_total",
      { description: "Count of rate-limit denials (labels: route)" },
    );
    _rateLimitBlocksTotal.add(value, attrs);
  },
} as Counter;

// ─── File uploads ────────────────────────────────────────────────────
// Uploads flow through BullMQ, so queue_job_* gives coarse signal. These
// break out per-file outcomes and size distribution by folder (category),
// which queue-level metrics cannot see (one job = many files).
let _fileUploadTotal: Counter | undefined;
export const fileUploadTotal: Counter = {
  add: (value, attrs) => {
    _fileUploadTotal ??= getMeter().createCounter("file_upload_total", {
      description:
        "Count of individual file upload outcomes (labels: category, outcome)",
    });
    _fileUploadTotal.add(value, attrs);
  },
} as Counter;

let _fileUploadBytes: Histogram | undefined;
export const fileUploadBytes: Histogram = {
  record: (value, attrs) => {
    _fileUploadBytes ??= getMeter().createHistogram("file_upload_bytes", {
      description: "Size of uploaded files in bytes (labels: category)",
      unit: "By",
    });
    _fileUploadBytes.record(value, attrs);
  },
} as Histogram;

let _fileDeleteTotal: Counter | undefined;
export const fileDeleteTotal: Counter = {
  add: (value, attrs) => {
    _fileDeleteTotal ??= getMeter().createCounter("file_delete_total", {
      description:
        "Count of file delete outcomes (labels: entity_type, outcome); outcome=missing when the object was not found in storage",
    });
    _fileDeleteTotal.add(value, attrs);
  },
} as Counter;

// ─── Typesense ───────────────────────────────────────────────────────
let _typesenseSearchDurationSeconds: Histogram | undefined;
export const typesenseSearchDurationSeconds: Histogram = {
  record: (value, attrs) => {
    _typesenseSearchDurationSeconds ??= getMeter().createHistogram(
      "typesense_search_duration_seconds",
      { description: "Typesense search duration in seconds", unit: "s" },
    );
    _typesenseSearchDurationSeconds.record(value, attrs);
  },
} as Histogram;

let _typesenseSearchResultCount: Histogram | undefined;
export const typesenseSearchResultCount: Histogram = {
  record: (value, attrs) => {
    _typesenseSearchResultCount ??= getMeter().createHistogram(
      "typesense_search_result_count",
      { description: "Typesense search result counts per query" },
    );
    _typesenseSearchResultCount.record(value, attrs);
  },
} as Histogram;

// ─── Observable gauges ───────────────────────────────────────────────
// queue_depth and typesense_index_lag are registered by queueService at
// init time (see registerQueueDepthGauges) because they need queue handles.
type JobCountsProvider = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getJobCounts: (...types: any[]) => Promise<Record<string, number>>;
};

export function registerQueueDepthGauges(
  queuesProvider: () => Map<string, JobCountsProvider>,
  typesenseQueueNames: readonly string[],
) {
  const meter = getMeter();
  meter
    .createObservableGauge("queue_depth", {
      description:
        "Current BullMQ queue depth (waiting+active+delayed), labels: queue",
    })
    .addCallback(async (result) => {
      for (const [name, queue] of queuesProvider()) {
        try {
          const counts = await queue.getJobCounts(
            "waiting",
            "active",
            "delayed",
          );
          const total =
            (counts.waiting ?? 0) +
            (counts.active ?? 0) +
            (counts.delayed ?? 0);
          result.observe(total, { queue: name });
        } catch {
          // best-effort — skip inaccessible queue
        }
      }
    });

  meter
    .createObservableGauge("typesense_index_lag", {
      description:
        "Backlog of pending typesense indexer jobs (waiting+active+delayed), labels: index",
    })
    .addCallback(async (result) => {
      const queues = queuesProvider();
      for (const name of typesenseQueueNames) {
        const q = queues.get(name);
        if (!q) continue;
        try {
          const counts = await q.getJobCounts("waiting", "active", "delayed");
          const total =
            (counts.waiting ?? 0) +
            (counts.active ?? 0) +
            (counts.delayed ?? 0);
          result.observe(total, { index: name });
        } catch {
          // best-effort
        }
      }
    });
}
