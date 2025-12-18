import pino from "pino";
import pretty from "pino-pretty";
import { env } from "@/config/env";

const stream = pretty({
  colorize: true,
  translateTime: "yyyy-mm-dd HH:MM:ss.l",
  ignore: "pid,hostname",
});

/**
 * Configured Pino logger instance for the application.
 * This logger is set up with pretty printing for development environments, including colorized output,
 * timestamp translation, and exclusion of pid and hostname fields. The log level is determined by the
 * LOG_LEVEL environment variable. It provides structured logging capabilities throughout the application
 * for debugging, monitoring, and error tracking.
 */
export default pino(
  {
    level: env.LOG_LEVEL,
  },
  stream,
);
