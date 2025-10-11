import pino from "pino";
import { env } from "@/config/env";

export default pino({
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
    },
  },
});
