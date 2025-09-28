import { Request } from "express";
import { SafeUser, UpdateUserProfile } from "../schema/users";
import { RegisterData, LoginCredentials } from "../../services/auth.service";
import { Session } from "../schema/sessions";
import { ChangePasswordData, EmailData } from "./common";

export interface AuthRequest extends Request {
  userId?: number;
  sessionId?: number;
  user?: SafeUser;
  sanitizedBody?: RegisterData | LoginCredentials | ChangePasswordData | RefreshTokenData | UpdateUserProfile | EmailData | ResetPasswordData;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface TokenPayload {
  userId: number;
  sessionId?: number;
  iat?: number;
  exp?: number;
}

export interface AuthSession extends Session {}