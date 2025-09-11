import { describe, it, expect } from 'vitest';
import type { ApiResponse, ErrorResponse, User, CreateUserRequest } from '@/types';

describe('Type Definitions Tests', () => {
  describe('ApiResponse Interface', () => {
    it('should create a valid success response', () => {
      const response: ApiResponse<User> = {
        status: 'success',
        message: 'User created successfully',
        data: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      expect(response.status).toBe('success');
      expect(response.message).toBeDefined();
      expect(response.data).toBeDefined();
      expect(response.timestamp).toBeDefined();
    });

    it('should create a valid error response', () => {
      const response: ApiResponse = {
        status: 'error',
        message: 'Something went wrong',
        timestamp: new Date().toISOString(),
      };

      expect(response.status).toBe('error');
      expect(response.message).toBeDefined();
      expect(response.data).toBeUndefined();
    });
  });

  describe('ErrorResponse Interface', () => {
    it('should create a valid error response', () => {
      const errorResponse: ErrorResponse = {
        status: 'error',
        message: 'Validation failed',
        error: 'Invalid email format',
        timestamp: new Date().toISOString(),
      };

      expect(errorResponse.status).toBe('error');
      expect(errorResponse.message).toBeDefined();
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.timestamp).toBeDefined();
    });
  });

  describe('User Interface', () => {
    it('should create a valid user object', () => {
      const user: User = {
        id: 1,
        name: 'Jane Doe',
        email: 'jane@example.com',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
      };

      expect(user.id).toBeTypeOf('number');
      expect(user.name).toBeTypeOf('string');
      expect(user.email).toBeTypeOf('string');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('CreateUserRequest Interface', () => {
    it('should create a valid create user request', () => {
      const createUserRequest: CreateUserRequest = {
        name: 'New User',
        email: 'newuser@example.com',
      };

      expect(createUserRequest.name).toBeTypeOf('string');
      expect(createUserRequest.email).toBeTypeOf('string');
      expect(createUserRequest.name).toBe('New User');
      expect(createUserRequest.email).toBe('newuser@example.com');
    });

    it('should validate required fields', () => {
      const createUserRequest: CreateUserRequest = {
        name: '',
        email: '',
      };

      // Even empty strings are valid TypeScript-wise
      expect(createUserRequest.name).toBeDefined();
      expect(createUserRequest.email).toBeDefined();
    });
  });
});
