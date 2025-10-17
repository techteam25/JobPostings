import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import { z } from "zod";
import validate from "../middleware/validation.middleware";
import {
  getUserSchema,
  changeUserPasswordSchema,
  updateUserPayloadSchema,
  createUserPayloadSchema,
  deleteSelfSchema,
} from "@/validations/user.validation";
import { registry } from "@/swagger/registry";
import { apiResponseSchema, errorResponseSchema } from "@/types";
import { selectUserProfileSchema, selectUserSchema } from "@/db/schema";

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

const userResponseSchema = apiResponseSchema(
  selectUserSchema.extend({
    profile: selectUserProfileSchema,
  }),
);

// All user routes require authentication
router.use(authMiddleware.authenticate);

// Current user routes

registry.registerPath({
  method: "get",
  path: "/users/me",
  tags: ["Users"],
  summary: "Get Current User",
  description: "Retrieve the currently logged-in user's details.",
  responses: {
    200: {
      description: "Current user retrieved successfully",
      content: {
        "application/json": {
          schema: userResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.get("/me", userController.getCurrentUser);

registry.registerPath({
  method: "put",
  path: "/users/me/profile",
  tags: ["Users"],
  summary: "Update User Profile",
  description:
    "Update the profile information of the currently logged-in user.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateUserPayloadSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "User profile updated successfully",
      content: {
        "application/json": {
          schema: userResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.put(
  "/me/profile",
  validate(updateUserPayloadSchema),
  userController.updateProfile,
);

registry.registerPath({
  method: "post",
  path: "/users/me/profile",
  tags: ["Users"],
  summary: "Create User Profile",
  description: "Create a profile for the currently logged-in user.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserPayloadSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "User profile created successfully",
      content: {
        "application/json": {
          schema: userResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.post(
  "/me/profile",
  validate(createUserPayloadSchema),
  userController.createProfile,
);

registry.registerPath({
  method: "post",
  path: "/users/me/change-password",
  tags: ["Users"],
  summary: "Change Password",
  description: "Allow authenticated users to change their password after validating the current one.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: changeUserPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password changed successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({ message: z.string() })),
        },
      },
    },
    400: {
      description: "Validation error or incorrect current password",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

router.post(
  "/me/change-password",
  validate(changeUserPasswordSchema),
  userController.changePassword,
);

registry.registerPath({
  method: "patch",
  path: "/users/me/deactivate",
  tags: ["Users"],
  summary: "Deactivate Own Account",
  description: "Deactivate the currently logged-in user's account.",
  responses: {
    200: {
      description: "Account deactivated successfully",
      content: {
        "application/json": {
          schema: userResponseSchema,
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});
router.patch("/me/deactivate", userController.deactivateSelf);

registry.registerPath({
  method: "delete",
  path: "/users/me",
  tags: ["Users"],
  summary: "Delete Own Account",
  description: "Permanently delete the authenticated user's account after re-authentication.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: deleteSelfSchema.shape.body,
        },
      },
    },
  },
  responses: {
    204: { description: "Account deleted successfully" },
    400: { description: "Validation error or business rule violation", content: { "application/json": { schema: errorResponseSchema } } },
    401: { description: "Authentication required", content: { "application/json": { schema: errorResponseSchema } } },
    404: { description: "User not found", content: { "application/json": { schema: errorResponseSchema } } },
  },
});
router.delete(
  "/me",
  validate(deleteSelfSchema),
  userController.deleteSelf,
);

// Admin only routes for user management
router.get(
  "/",
  authMiddleware.requireRole(["admin"]),
  userController.getAllUsers,
);

router.get(
  "/stats",
  authMiddleware.requireRole(["admin"]),
  userController.getUserStats,
);

// User management routes (admin or self)
router.get("/:id", validate(getUserSchema), userController.getUserById);

router.put(
  "/:id",
  validate(updateUserPayloadSchema),
  userController.updateUser,
);

// Admin-only user activation/deactivation
router.patch(
  "/:id/deactivate",
  validate(getUserSchema),
  authMiddleware.requireRole(["admin"]),
  userController.deactivateUser,
);

router.patch(
  "/:id/activate",
  validate(getUserSchema),
  authMiddleware.requireRole(["admin"]),
  userController.activateUser,
);

router.delete(
  "/:id",
  validate(getUserSchema),
  authMiddleware.requireRole(["admin"]),
  userController.deleteUser,
);

export default router;