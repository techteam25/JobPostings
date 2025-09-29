import { Request } from "express";
import { SafeUser, UpdateUser, UpdateUserProfile } from "../schema/users";
import { ChangePasswordData, EmailData } from "./common";

export interface UserRequest extends Request {
  userId?: number;
  sessionId?: number;
  user?: SafeUser;
  sanitizedBody?: UpdateUser | UpdateUserProfile | ChangePasswordData | EmailData;
}