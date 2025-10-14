import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  getUserSchema,
  changeUserPasswordSchema,
  updateUserPayloadSchema,
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
router.post(
  "/me/change-password",
  validate(changeUserPasswordSchema),
  userController.changePassword,
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
