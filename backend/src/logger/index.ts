import pino from "pino";
import pretty from "pino-pretty";
import { env } from "@/config/env";

const stream = pretty({
  colorize: true,
  translateTime: "yyyy-mm-dd HH:MM:ss.l",
  ignore: "pid,hostname",
});

export default pino(
  {
    level: env.LOG_LEVEL,
  },
  stream,
);
