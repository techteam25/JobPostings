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
  savedJobsSchema,
} from "@/validations/user.validation";
import { registry } from "@/swagger/registry";
import {
  apiPaginatedResponseSchema,
  apiResponseSchema,
  errorResponseSchema,
} from "@/types";
import {
  selectUserProfileSchema,
  selectUserSchema,
} from "@/validations/userProfile.validation";
import { getJobSchema } from "@/validations/job.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

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

/**
 * Retrieves the authenticated user's profile information.
 * This authenticated endpoint fetches the current user's details, including profile.
 * Includes caching for performance optimization.
 * @route GET /users/me
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the user details.
 */
router.get("/me", cacheMiddleware({ ttl: 600 }), userController.getCurrentUser);

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

/**
 * Retrieves the profile completion status for the authenticated user.
 * This authenticated endpoint checks if the user's profile is complete based on required fields.
 * @route GET /users/me/status
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the profile completion status.
 */
router.get("/me/status", userController.getUserProfileStatus);

registry.registerPath({
  method: "get",
  path: "/users/me/intent",
  tags: ["Users"],
  summary: "Get Current User Intent",
  description: "Retrieve the intent of the currently logged-in user.",
  responses: {
    200: {
      description: "User intent status retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              intent: z.enum(["seeker", "employer"]),
              status: z.enum(["completed", "pending"]),
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
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves the onboarding intent for the authenticated user.
 * This authenticated endpoint fetches the user's intent (job seeker or employer) and status.
 * @route GET /users/me/intent
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the user's intent and status.
 */
router.get("/me/intent", userController.getCurrentUserIntent);

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

/**
 * Updates the authenticated user's profile.
 * This authenticated endpoint allows users to modify their profile information.
 * Invalidates cache for current user data.
 * @route PUT /users/me/profile
 * @param {Object} req.body - Request body with updated profile details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated profile.
 */
router.put(
  "/me/profile",
  validate(updateUserPayloadSchema),
  invalidateCacheMiddleware(() => "users/me"),
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

/**
 * Creates a user profile for the authenticated user.
 * This authenticated endpoint allows users to create their profile with education, work experience, etc.
 * Invalidates cache for current user data.
 * @route POST /users/me/profile
 * @param {Object} req.body - Request body with profile details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the created profile.
 */
router.post(
  "/me/profile",
  validate(createUserPayloadSchema),
  invalidateCacheMiddleware(() => "users/me"),
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

/**
 * Deactivates the authenticated user's account.
 * This authenticated endpoint allows users to deactivate their own account.
 * Invalidates cache for current user data.
 * @route PATCH /users/me/deactivate
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming account deactivation.
 */
router.patch(
  "/me/deactivate",
  invalidateCacheMiddleware(() => "users/me"),
  userController.deactivateSelf,
);

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

/**
 * Deletes the authenticated user's account.
 * This authenticated endpoint allows users to permanently delete their own account.
 * Invalidates cache for current user data.
 * @route DELETE /users/me
 * @param {Object} req.body - Request body with password confirmation.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming account deletion.
 */
router.delete(
  "/me/delete",
  validate(deleteSelfSchema),
  invalidateCacheMiddleware(() => "users/me"),
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
          schema: apiPaginatedResponseSchema(savedJobsSchema),
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

/**
 * Retrieves saved jobs for the authenticated user with pagination.
 * This authenticated endpoint fetches the user's saved jobs list.
 * Requires user authentication and job seeker role.
 * Includes caching for performance optimization.
 * @route GET /users/me/saved-jobs
 * @param {Object} req.query - Query parameters for pagination.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the paginated list of saved jobs.
 */
router.get(
  "/me/saved-jobs",
  authMiddleware.requireUserRole,
  validate(getUserSavedJobsQuerySchema),
  cacheMiddleware({ ttl: 300 }),
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

/**
 * Checks if a job is saved by the authenticated user.
 * This authenticated endpoint verifies if a specific job is in the user's saved jobs list.
 * Requires user authentication and job seeker role.
 * @route GET /users/me/saved-jobs/:jobId/check
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the saved status.
 */
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

/**
 * Saves a job for the authenticated user.
 * This authenticated endpoint adds a job to the user's saved jobs list.
 * Requires user authentication and job seeker role.
 * Invalidates cache for saved jobs list.
 * @route POST /users/me/saved-jobs/:jobId
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming the job was saved.
 */
router.post(
  "/me/saved-jobs/:jobId",
  authMiddleware.requireUserRole,
  validate(getJobSchema),
  invalidateCacheMiddleware(() => "users/me/saved-jobs"),
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

/**
 * Unsaves a job for the authenticated user.
 * This authenticated endpoint removes a job from the user's saved jobs list.
 * Requires user authentication and job seeker role.
 * Invalidates cache for saved jobs list.
 * @route DELETE /users/me/saved-jobs/:jobId
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming the job was unsaved.
 */
router.delete(
  "/me/saved-jobs/:jobId",
  authMiddleware.requireUserRole,
  validate(getJobSchema),
  invalidateCacheMiddleware(() => "users/me/saved-jobs"),
  userController.unsaveJobForCurrentUser,
);

// Admin only routes for user management

/**
 * Retrieves all users with pagination and search.
 * This authenticated endpoint fetches a list of users, with support for search and pagination.
 * Requires admin or owner role.
 * @route GET /users
 * @param {Object} req.query - Query parameters for pagination and search term.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with a paginated list of users.
 */
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

/**
 * Retrieves a user by their ID.
 * This authenticated endpoint fetches details of a specific user.
 * Requires admin/owner role or access to own account.
 * @route GET /users/:id
 * @param {Object} req.params - Route parameters including the user id.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the user details.
 */
router.get(
  "/:id",
  authMiddleware.requireOwnAccount,
  validate(getUserSchema),
  userController.getUserById,
);

/**
 * Updates a user's basic information.
 * This authenticated endpoint allows updating user details like name and email.
 * Requires admin/owner role or access to own account.
 * @route PUT /users/:id
 * @param {Object} req.params - Route parameters including the user id.
 * @param {Object} req.body - Request body with updated user details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated user.
 */
router.put(
  "/:id",
  authMiddleware.requireOwnAccount,
  validate(updateUserPayloadSchema),
  userController.updateUser,
);

// Admin-only user activation/deactivation

/**
 * Deactivates another user's account.
 * This authenticated endpoint allows deactivating another user's account (admin action).
 * Requires admin or owner role.
 * @route PATCH /users/:id/deactivate
 * @param {Object} req.params - Route parameters including the user id.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming account deactivation.
 */
router.patch(
  "/:id/deactivate",
  validate(getUserSchema),
  authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
  userController.deactivateUser,
);

/**
 * Activates a user's account.
 * This authenticated endpoint allows activating a deactivated user account.
 * Requires admin or owner role.
 * @route PATCH /users/:id/activate
 * @param {Object} req.params - Route parameters including the user id.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming account activation.
 */
router.patch(
  "/:id/activate",
  validate(getUserSchema),
  authMiddleware.requireAdminOrOwnerRole(["admin", "owner"]),
  userController.activateUser,
);

/**
 * Deletes a user account.
 * This authenticated endpoint allows deleting another user's account (admin action).
 * Requires owner role.
 * @route DELETE /users/:id
 * @param {Object} req.params - Route parameters including the user id.
 * @param {Object} req.body - Request body with deletion token.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming user deletion.
 */
router.delete(
  "/:id",
  validate(getUserSchema),
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  userController.deleteUser,
);

export default router;
