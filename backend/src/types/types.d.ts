import { Logger } from "pino";
import { User } from "@/validations/userProfile.validation";

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
