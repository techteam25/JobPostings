import { Logger } from "pino";
import { User } from "@/validations/userProfile.validation";
import { File } from "@/config/multer";

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
      sessionId?: number;
      organizationId?: number;
      user?: User;
      files?: { [fieldname: string]: File[] } | File[];
      log: Logger;
    }
  }
}
