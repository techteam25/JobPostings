import { createClient } from "redis";
import { env } from "@/config/env";
import { RedisStore } from "rate-limit-redis";

const redisClient = createClient({
  url: env.REDIS_URL,
});

export const store = new RedisStore({
  sendCommand: (...args: string[]) => redisClient.sendCommand(args),
});
