import { User } from "@/db/schema";
import { Logger } from "pino";

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
      sessionId?: number;
      user?: User;
      log: Logger;
    }
  }
}
