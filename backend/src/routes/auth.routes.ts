import { Router } from "express";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { AuthController } from "@/controllers/auth.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "@/middleware/validation.middleware";
import {
  registerUserSchema,
  userLoginSchema,
  userRefreshTokenSchema,
  changeUserPasswordSchema,
} from "@/validations/auth.validation";

const router = Router();
const registry = new OpenAPIRegistry();

const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Public routes
registry.registerPath({
  method: "post",
  path: "/api/auth/register",
  summary: "Register a new user",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
    },
    400: {
      description: "Validation error",
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

registry.registerPath({
  method: "post",
  path: "/api/auth/login",
  summary: "Login user",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userLoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
    },
    400: {
      description: "Invalid credentials",
    },
  },
});
router.post("/login", validate(userLoginSchema), authController.login);

registry.registerPath({
  method: "post",
  path: "/api/auth/refresh-token",
  summary: "Refresh authentication token",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userRefreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Token refreshed successfully",
    },
    400: {
      description: "Invalid refresh token",
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

registry.registerPath({
  method: "post",
  path: "/api/auth/logout",
  summary: "Logout user",
  tags: ["Auth"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Logout successful",
    },
    401: {
      description: "Unauthorized",
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

registry.registerPath({
  method: "get",
  path: "/api/auth/profile/{profileId}",
  summary: "Get user profile by ID",
  tags: ["Auth"],
  parameters: [
    {
      name: "profileId",
      in: "path",
      required: true,
      schema: {
        type: "string",
      },
    },
  ],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Profile data",
    },
    401: {
      description: "Unauthorized",
    },
    404: {
      description: "Profile not found",
    },
    429: {
      description: "Too many attempts",
    },
  },
});
router.get(
  "/profile/:profileId",
  authMiddleware.authenticate,
  authController.getProfile,
);

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
          schema: changeUserPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
    },
    400: {
      description: "Validation error",
    },
    401: {
      description: "Unauthorized",
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

export { registry };
export default router;
