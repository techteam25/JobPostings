// API Response types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  error?: string;
  timestamp: string;
}

// Example User type
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request body types
export interface CreateUserRequest {
  name: string;
  email: string;
}
