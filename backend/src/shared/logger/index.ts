import { mkdirSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
import { trace } from "@opentelemetry/api";
import pino from "pino";
import pretty from "pino-pretty";
import pinoRoll from "pino-roll";
import { env, isProduction } from "@shared/config/env";

const resolvedLogFilePath = isAbsolute(env.LOG_FILE_PATH)
  ? env.LOG_FILE_PATH
  : resolve(process.cwd(), env.LOG_FILE_PATH);

mkdirSync(dirname(resolvedLogFilePath), { recursive: true });

const rollingFileStream = await pinoRoll({
  file: resolvedLogFilePath,
  size: "10m",
  frequency: "daily",
  mkdir: true,
});

const streams: pino.StreamEntry[] = isProduction
  ? [{ stream: rollingFileStream }]
  : [
      {
        stream: pretty({
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        }),
      },
      { stream: rollingFileStream },
    ];

// OTel trace correlation via mixin: @opentelemetry/instrumentation-pino uses
// require-in-the-middle CJS hooks that Bun's ESM loader bypasses, so the
// auto-instrumentation never patches our pino instance. Pulling the active
// span from @opentelemetry/api at log time is loader-agnostic and costs
// nothing when OTEL_ENABLED=false (no-op tracer returns undefined).
export default pino(
  {
    level: env.LOG_LEVEL,
    redact: {
      paths: [
        "req.headers.cookie",
        "req.headers.authorization",
        "res.headers['set-cookie']",
      ],
    },
    mixin() {
      const span = trace.getActiveSpan();
      if (!span) return {};
      const ctx = span.spanContext();
      return {
        trace_id: ctx.traceId,
        span_id: ctx.spanId,
        trace_flags: `0${ctx.traceFlags.toString(16)}`,
      };
    },
  },
  pino.multistream(streams),
);
