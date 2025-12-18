import { Logger } from "pino";

import { User } from "@/validations/userProfile.validation";

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
      sessionId?: number;
      organizationId?: number;
      correlationId?: string;
      user?: User;
      log: Logger;
      file?: Express.Multer.File;
      files?:
        | { [fieldname: string]: Express.Multer.File[] }
        | Express.Multer.File[];
    }
  }
}
