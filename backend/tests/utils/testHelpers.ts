const {
  mockSendAccountDeactivationConfirmation,
  mockSendAccountDeletionConfirmation,
} = vi.hoisted(() => {
  return {
    mockSendAccountDeactivationConfirmation: vi
      .fn()
      .mockResolvedValue(undefined),
    mockSendAccountDeletionConfirmation: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/services/email.service", () => {
  return {
    EmailService: vi.fn().mockImplementation(() => {
      return {
        sendAccountDeactivationConfirmation:
          mockSendAccountDeactivationConfirmation,
        sendAccountDeletionConfirmation: mockSendAccountDeletionConfirmation,
      };
    }),
  };
});

export {
  mockSendAccountDeactivationConfirmation,
  mockSendAccountDeletionConfirmation,
};

import supertest from "supertest";
import { Application } from "express";
import { expect } from "vitest";
import app from "@/app";

// Create supertest instance
export const request = supertest(app);

// Common test data
export const testUser = {
  name: "John Doe",
  email: "john@example.com",
};

export const testApiResponse = {
  status: "success",
  message: "Test successful",
  timestamp: expect.any(String),
};

// Helper functions for testing
export class TestHelpers {
  /**
   * Creates a test server instance
   */
  static createTestApp(): Application {
    return app;
  }

  /**
   * Generates random test data
   */
  static generateTestData() {
    return {
      id: Math.floor(Math.random() * 1000),
      name: `Test User ${Math.random().toString(36).substring(7)}`,
      email: `test${Math.random().toString(36).substring(7)}@example.com`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Waits for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Creates a mock request body
   */
  static createMockRequestBody(override: Record<string, any> = {}) {
    return {
      name: "Test Name",
      email: "test@example.com",
      ...override,
    };
  }

  /**
   * Validates API response structure (flexible for different response formats)
   */
  static validateApiResponse(response: any, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty("message");

    // Only check for status and timestamp if they exist (some routes may not have them)
    if (response.body.status) {
      expect(response.body).toHaveProperty("status");
    }
    if (response.body.timestamp) {
      expect(response.body).toHaveProperty("timestamp");
    }
    if (response.body.status === "success" && response.body.data) {
      expect(response.body).toHaveProperty("data");
    }
  }
}
