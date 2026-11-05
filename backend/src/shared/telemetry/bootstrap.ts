import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { AggregationTemporalityPreference } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { env } from "@shared/config/env";

let sdk: NodeSDK | null = null;

if (env.OTEL_ENABLED) {
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: "1.0.0",
      "deployment.environment.name": env.NODE_ENV,
    }),
    traceExporter: new OTLPTraceExporter({
      url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    metricReader: new PeriodicExportingMetricReader({
      // CUMULATIVE temporality is required by Prometheus's OTLP ingest
      // (the default LOWMEMORY preference emits histograms as DELTA, which
      // Prometheus rejects with "invalid temporality and type combination").
      exporter: new OTLPMetricExporter({
        url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
        temporalityPreference: AggregationTemporalityPreference.CUMULATIVE,
      }),
      exportIntervalMillis: 30_000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // fs spans are high-volume and not useful at v1 — suppress.
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });

  sdk.start();

  const shutdown = async (signal: string) => {
    try {
      await sdk?.shutdown();

      console.log(`[otel] SDK shut down on ${signal}`);
    } catch (err) {
      console.error("[otel] shutdown error", err);
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
}

export { sdk };
