import { User } from "../db/schema";

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
      sessionId?: number;
      user?: User;
    }
  }
}
