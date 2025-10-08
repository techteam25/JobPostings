import { createClient } from "redis";
import { env } from "@/config/env";
import { RedisStore } from "rate-limit-redis";
import logger from "@/logger";

const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on("error", (err) => logger.error(err, "Redis Client Error"));

redisClient.connect().catch(logger.error);

export const store = new RedisStore({
  sendCommand: (...args: string[]) => redisClient.sendCommand(args),
});
