import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/middleware/logger';

// Mock console.log to test logging
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Middleware Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockRequest = {
      method: 'GET',
      url: '/test',
      get: vi.fn((header: string) => {
        if (header === 'User-Agent') return 'Test-Agent/1.0';
        return undefined;
      }),
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('Logger Middleware', () => {
    it('should log request information', () => {
      logger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/test - Test-Agent\/1\.0/)
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle missing User-Agent header', () => {
      mockRequest.get = vi.fn(() => undefined);
      
      logger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] GET \/test - Unknown/)
      );
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should log different HTTP methods correctly', () => {
      mockRequest.method = 'POST';
      mockRequest.url = '/api/users';
      
      logger(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/POST \/api\/users/)
      );
    });
  });
});
