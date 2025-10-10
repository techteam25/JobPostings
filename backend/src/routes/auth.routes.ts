import { Router } from "express";

import { AuthController } from "@/controllers/auth.controller";

import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "@/middleware/validation.middleware";

import {
  registerUserSchema,
  userLoginSchema,
  userRefreshTokenSchema,
  changeUserPasswordSchema,
} from "@/validations/auth.validation";
import { registry } from "@/swagger/registry";

const router = Router();

const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes

// Registration Route
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Register a new user",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerUserSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "User registered successfully",
              },
              data: {
                type: "object",
                properties: {
                  user: { type: "object" }, // Simplified for brevity
                  tokens: { type: "object" }, // Simplified for brevity
                },
              },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "Registration failed" },
              error: { type: "string", example: "Detailed error message" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    429: {
      description: "Too many login attempts",
    },
  },
});
router.post(
  "/register",
  validate(registerUserSchema), // Use schema directly
  authController.register,
);

// Login Route
registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Login user",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userLoginSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Login successful" },
              data: {
                type: "object",
                properties: {
                  tokens: { type: "object" }, // Simplified for brevity
                },
              },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "Login failed" },
              error: { type: "string", example: "Detailed error message" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    429: {
      description: "Too many login attempts",
    },
  },
});
router.post("/login", validate(userLoginSchema), authController.login);

// Refresh Token Route
registry.registerPath({
  method: "post",
  path: "/api/auth/refresh-token",
  summary: "Refresh authentication token",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userRefreshTokenSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token refreshed successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Token refreshed successfully",
              },
              data: {
                type: "object",
                properties: {
                  tokens: { type: "object" }, // Simplified for brevity
                },
              },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    400: {
      description: "Invalid refresh token",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "Token refresh failed" },
              error: { type: "string", example: "Detailed error message" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "User not authenticated" },
              error: { type: "string", example: "UNAUTHORIZED" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    429: {
      description: "Too many login attempts",
    },
  },
});
router.post(
  "/refresh-token",
  validate(userRefreshTokenSchema),
  authController.refreshToken,
);

// Protected routes

// Logout Route
registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  summary: "Logout user",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Logout successful",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Logout successful" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "User not authenticated" },
              error: { type: "string", example: "UNAUTHORIZED" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden - User account is not active",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: {
                type: "string",
                example: "User account is not active",
              },
              error: { type: "string", example: "FORBIDDEN" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    429: {
      description: "Too many attempts",
    },
  },
});
router.post("/logout", authMiddleware.authenticate, authController.logout);

// router.post(
//   "/logout-all",
//   authMiddleware.authenticate,
//   authController.logoutAll,
// );

// Change Password Route
registry.registerPath({
  method: "post",
  path: "/api/auth/change-password",
  summary: "Change user password",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: changeUserPasswordSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: {
                type: "string",
                example: "Password changed successfully",
              },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "Password change failed" },
              error: { type: "string", example: "Detailed error message" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              status: { type: "string", example: "error" },
              message: { type: "string", example: "User not authenticated" },
              error: { type: "string", example: "UNAUTHORIZED" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    429: {
      description: "Too many attempts",
    },
  },
});
router.post(
  "/change-password",
  authMiddleware.authenticate,
  validate(changeUserPasswordSchema),
  authController.changePassword,
);

export default router;
