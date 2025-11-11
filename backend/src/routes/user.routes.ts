import { Router } from "express";
import { UserController } from "@/controllers/user.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import { z } from "zod";
import validate from "@/middleware/validation.middleware";
import {
  getUserSchema,
  updateUserPayloadSchema,
  createUserPayloadSchema,
  deleteSelfSchema,
  getUserSavedJobsQuerySchema,
} from "@/validations/user.validation";
import { registry } from "@/swagger/registry";
import { apiResponseSchema, errorResponseSchema } from "@/types";
import {
  selectUserProfileSchema,
  selectUserSchema,
} from "@/validations/userProfile.validation";
import { getJobSchema } from "@/validations/job.validation";

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
  method: "get",
  path: "/users/me/status",
  tags: ["Users"],
  summary: "Get Current User Profile Status (complete/incomplete)",
  description: "Retrieve the profile status of the currently logged-in user.",
  responses: {
    200: {
      description: "User profile status retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              complete: z.boolean(),
            }),
          ),
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
router.get("/me/status", userController.getUserProfileStatus);

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
  description:
    "Permanently delete the authenticated user's account after re-authentication.",
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
    400: {
      description: "Validation error or business rule violation",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "User not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});
router.delete(
  "/me/delete",
  validate(deleteSelfSchema),
  userController.deleteSelf,
);

registry.registerPath({
  method: "get",
  path: "/users/me/saved-jobs",
  tags: ["Users"],
  summary: "Get Saved Jobs for Current User",
  description:
    "Retrieve the list of jobs saved by the currently logged-in user.",
  responses: {
    200: {
      description: "Saved jobs retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              jobs: z.array(z.any()), // Replace z.any() with actual job schema
            }),
          ),
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
router.get(
  "/me/saved-jobs",
  authMiddleware.requireUserRole,
  validate(getUserSavedJobsQuerySchema),
  userController.getSavedJobsForCurrentUser,
);

registry.registerPath({
  method: "get",
  path: "/users/me/saved-jobs/{jobId}/check",
  tags: ["Users"],
  summary: "Check if Job is Saved for Current User",
  description:
    "Check if a specific job is saved in the currently logged-in user's saved jobs list.",
  parameters: [
    {
      name: "jobId",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "ID of the job to check",
    },
  ],
  responses: {
    200: {
      description: "Job saved status retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              isSaved: z.boolean(),
            }),
          ),
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
router.get(
  "/me/saved-jobs/:jobId/check",
  authMiddleware.requireUserRole,
  validate(getJobSchema),
  userController.checkIfJobIsSaved,
);

registry.registerPath({
  method: "post",
  path: "/users/me/saved-jobs/{jobId}",
  tags: ["Users"],
  summary: "Save Job for Current User",
  description: "Save a job to the currently logged-in user's saved jobs list.",
  parameters: [
    {
      name: "jobId",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "ID of the job to be saved",
    },
  ],
  responses: {
    200: {
      description: "Job saved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({})),
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
  "/me/saved-jobs/:jobId",
  authMiddleware.requireUserRole,
  validate(getJobSchema),
  userController.saveJobForCurrentUser,
);

registry.registerPath({
  method: "delete",
  path: "/users/me/saved-jobs/{jobId}",
  tags: ["Users"],
  summary: "Unsave Job for Current User",
  description:
    "Remove a job from the currently logged-in user's saved jobs list.",
  parameters: [
    {
      name: "jobId",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "ID of the job to be removed from saved jobs",
    },
  ],
  responses: {
    200: {
      description: "Job unsaved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({})),
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
router.delete(
  "/me/saved-jobs/:jobId",
  authMiddleware.requireUserRole,
  validate(getJobSchema),
  userController.unsaveJobForCurrentUser,
);

// Admin only routes for user management
router.get(
  "/",
  authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
  userController.getAllUsers,
);

// router.get(
//   "/stats",
//   authMiddleware.requireRole(["admin"]),
//   userController.getUserStats,
// );

// User management routes (admin or self)
router.get(
  "/:id",
  authMiddleware.requireOwnAccount,
  validate(getUserSchema),
  userController.getUserById,
);

router.put(
  "/:id",
  authMiddleware.requireOwnAccount,
  validate(updateUserPayloadSchema),
  userController.updateUser,
);

// Admin-only user activation/deactivation
router.patch(
  "/:id/deactivate",
  validate(getUserSchema),
  authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
  userController.deactivateUser,
);

router.patch(
  "/:id/activate",
  validate(getUserSchema),
  authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
  userController.activateUser,
);

router.delete(
  "/:id",
  validate(getUserSchema),
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  userController.deleteUser,
);

export default router;
