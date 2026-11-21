import { Logger } from "pino";
import { InferSelectModel } from "drizzle-orm";

import { User } from "@/validations/userProfile.validation";
import { organizationInvitations } from "@/db/schema";

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
      sessionId?: number;
      organizationId?: number;
      correlationId?: string;
      user?: User;
      invitation?: InferSelectModel<typeof organizationInvitations>;
      log: Logger;
      file?: Express.Multer.File;
      files?:
        | { [fieldname: string]: Express.Multer.File[] }
        | Express.Multer.File[];
    }
  }
}
