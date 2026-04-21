/* eslint-disable no-console */
// Spike script for Task 1271 — validate @opentelemetry/sdk-node + auto-instrumentations under Bun.
// Run: bun run scripts/otel-spike.ts
// Requires the observability stack up (services:up).

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

const ALLOY_ENDPOINT = "http://localhost:4317";
const TEMPO_QUERY = "http://localhost:3200";
const SERVICE_NAME = "otel-spike";

type ProbeResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const results: ProbeResult[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  const mark = ok ? "✅" : "❌";
  console.log(`${mark} ${name}: ${detail}`);
}

async function main() {
  // ── Probe 1: SDK bootstrap ───────────────────────────────────────────
  let sdk: NodeSDK | null = null;
  try {
    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SERVICE_NAME,
        [ATTR_SERVICE_VERSION]: "0.0.0-spike",
      }),
      traceExporter: new OTLPTraceExporter({ url: ALLOY_ENDPOINT }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });
    sdk.start();
    record("SDK.start()", true, "NodeSDK started without throwing");
  } catch (err) {
    record(
      "SDK.start()",
      false,
      err instanceof Error ? err.message : String(err),
    );
    process.exit(1);
  }

  // ── Probe 2: Express auto-instrumentation ────────────────────────────
  try {
    const express = (await import("express")).default;
    const app = express();
    app.get("/spike-ping", (_req, res) => res.json({ ok: true }));
    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : null;
    if (!port) throw new Error("no port");

    const res = await fetch(`http://localhost:${port}/spike-ping`);
    const body = await res.json();
    record(
      "express + http client",
      res.ok && body.ok === true,
      `GET /spike-ping → ${res.status}`,
    );
    server.close();
  } catch (err) {
    record(
      "express + http client",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // ── Probe 3: mysql2 instrumentation (module patch only) ──────────────
  try {
    const mysql = await import("mysql2/promise");
    record(
      "mysql2 import",
      typeof mysql.createConnection === "function",
      "mysql2/promise imported (instrumentation applies at require-time)",
    );
  } catch (err) {
    record(
      "mysql2 import",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // ── Probe 4: redis (node-redis v5) — NOT covered by auto-instr ───────
  try {
    await import("redis");
    record(
      "node-redis v5",
      false,
      "loaded, but auto-instrumentations-node does not cover node-redis v5 (only ioredis). GAP.",
    );
  } catch (err) {
    record(
      "node-redis v5",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // ── Probe 5: wait for export, then query Tempo for the service ───────
  console.log(
    "\nFlushing exporter + sleeping 6s for Alloy → Tempo propagation...",
  );
  await new Promise((r) => setTimeout(r, 6_000));

  try {
    const probe = await fetch(
      `${TEMPO_QUERY}/api/search?tags=${encodeURIComponent(`service.name=${SERVICE_NAME}`)}&limit=3`,
    );
    const body = (await probe.json()) as {
      traces?: Array<{ rootServiceName?: string; traceID?: string }>;
    };
    const hit = (body.traces ?? []).some(
      (t) => t.rootServiceName === SERVICE_NAME,
    );
    record(
      "trace delivered to Tempo",
      hit,
      hit
        ? `found ${body.traces?.length ?? 0} trace(s) for service.name="${SERVICE_NAME}" (e.g. traceID=${body.traces?.[0]?.traceID?.slice(0, 12)}...)`
        : `no traces for service.name="${SERVICE_NAME}"`,
    );
  } catch (err) {
    record(
      "trace delivered to Tempo",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  // ── Shutdown ─────────────────────────────────────────────────────────
  try {
    await sdk?.shutdown();
    record("SDK.shutdown()", true, "clean shutdown");
  } catch (err) {
    record(
      "SDK.shutdown()",
      false,
      err instanceof Error ? err.message : String(err),
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nSummary: ${results.length - failed.length}/${results.length} passed`,
  );
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
