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
