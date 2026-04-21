import { mkdirSync } from "fs";
import { dirname, isAbsolute, resolve } from "path";
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
  },
  pino.multistream(streams),
);
