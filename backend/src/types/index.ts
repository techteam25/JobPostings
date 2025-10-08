// API Response types
import { Response } from "express";

export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  timestamp?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SearchParams {
  search?: string;
}

export interface ErrorResponse {
  status: "error";
  message: string;
  error?: string;
  timestamp: string;
}

// Example User type
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "employer" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Request body types
export interface CreateUserRequest {
  name: string;
  email: string;
}

// Authenticated request type
export interface AuthRequest extends Request {
  userId?: number;
  sessionId?: number;
  user?: User;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  nextPage: number | null;
  previousPage: number | null;
}
