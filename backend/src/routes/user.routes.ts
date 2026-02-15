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
  getUserEmailPreferencesSchema,
  updateUserEmailPreferencesSchema,
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
import { selectOrganizationSchema } from "@/validations/organization.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import {
  createJobAlertSchema,
  getUserJobAlertsQuerySchema,
  getJobAlertSchema,
  selectJobAlertSchema,
  updateJobAlertSchema,
  deleteJobAlertSchema,
  togglePauseJobAlertSchema,
} from "@/validations/jobAlerts.validation";

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
  method: "patch",
  path: "/users/me/visibility",
  tags: ["Users"],
  summary: "Change Current User Profile Visibility",
  description:
    "Update the visibility status (public/private) of the currently logged-in user's profile.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            isProfilePublic: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "User profile visibility updated successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectUserProfileSchema),
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
 * Changes the profile visibility for the authenticated user.
 * This authenticated endpoint allows users to set their profile as public or private.
 * Invalidates cache for current user data.
 * @route PATCH /users/me/visibility
 * @param {Object} req.body - Request body with visibility status.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated profile.
 */
router.patch("/me/visibility", userController.changeProfileVisibility);

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
router.get(
  "/me/intent",
  cacheMiddleware({ ttl: 300 }),
  userController.getCurrentUserIntent,
);

registry.registerPath({
  method: "get",
  path: "/users/me/organizations",
  tags: ["Users"],
  summary: "Get Current User's Organizations",
  description:
    "Retrieve all organizations the currently logged-in user belongs to.",
  responses: {
    200: {
      description: "User organizations retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.array(
              z.object({
                id: z.number(),
                userId: z.number(),
                organizationId: z.number(),
                role: z.enum(["owner", "admin", "recruiter", "member"]),
                isActive: z.boolean(),
                createdAt: z.string(),
                updatedAt: z.string(),
                organization: selectOrganizationSchema,
              }),
            ),
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
 * Retrieves all organizations the authenticated user belongs to.
 * This authenticated endpoint fetches the user's organization memberships with organization details.
 * Includes caching for performance optimization.
 * @route GET /users/me/organizations
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the user's organizations.
 */
router.get(
  "/me/organizations",
  cacheMiddleware({ ttl: 300 }),
  userController.getUserOrganizations,
);

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

// Email preferences routes

registry.registerPath({
  method: "get",
  path: "/users/me/email-preferences",
  tags: ["Users"],
  summary: "Get User Email Notification Preferences",
  description:
    "Retrieve the email notification preferences for the authenticated user.",
  responses: {
    200: {
      description: "Email preferences retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(getUserEmailPreferencesSchema),
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
      description: "Email preferences not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Retrieves email preferences for the authenticated user.
 * This authenticated endpoint fetches the user's email notification preferences.
 * Includes caching for performance optimization.
 * @route GET /users/me/email-preferences
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the email preferences.
 */
router.get(
  "/me/email-preferences",
  cacheMiddleware({ ttl: 300 }),
  userController.getEmailPreferences,
);

registry.registerPath({
  method: "put",
  path: "/users/me/email-preferences",
  tags: ["Users"],
  summary: "Update User Email Notification Preferences",
  description:
    "Update the email notification preferences for the authenticated user.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateUserEmailPreferencesSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Email preferences updated successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(getUserEmailPreferencesSchema),
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
    404: {
      description: "Email preferences not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Updates email preferences for the authenticated user.
 * This authenticated endpoint allows users to modify their email notification preferences.
 * Note: Security alerts cannot be disabled.
 * Invalidates cache for email preferences.
 * @route PUT /users/me/email-preferences
 * @param {Object} req.body - Request body with updated preferences.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated preferences.
 */
router.put(
  "/me/email-preferences",
  validate(updateUserEmailPreferencesSchema),
  invalidateCacheMiddleware(() => "users/me/email-preferences"),
  userController.updateEmailPreferences,
);

registry.registerPath({
  method: "post",
  path: "/users/me/email-preferences/unsubscribe/{token}",
  tags: ["Users"],
  summary: "Unsubscribe from Email Notifications via Token",
  description:
    "Unsubscribe from email notifications using an unsubscribe token (from email footer). No authentication required.",
  parameters: [
    {
      name: "token",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Unsubscribe token from email",
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            jobMatchNotifications: z.boolean().optional(),
            applicationStatusNotifications: z.boolean().optional(),
            savedJobUpdates: z.boolean().optional(),
            weeklyJobDigest: z.boolean().optional(),
            monthlyNewsletter: z.boolean().optional(),
            marketingEmails: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Successfully unsubscribed from email notifications",
      content: {
        "application/json": {
          schema: apiResponseSchema(getUserEmailPreferencesSchema),
        },
      },
    },
    400: {
      description: "Invalid or expired token",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Token not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Unsubscribes a user from email notifications using a token.
 * This public endpoint allows users to unsubscribe via a link in their email.
 * No authentication required - token-based access.
 * @route POST /users/me/email-preferences/unsubscribe/:token
 * @param {Object} req.params - Route parameters including the token.
 * @param {Object} req.body - Optional partial preferences to selectively unsubscribe.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming unsubscription.
 */
router.post(
  "/me/email-preferences/unsubscribe/:token",
  invalidateCacheMiddleware(() => "users/me/email-preferences"),
  userController.unsubscribeByToken,
);

registry.registerPath({
  method: "post",
  path: "/users/me/email-preferences/resubscribe",
  tags: ["Users"],
  summary: "Resubscribe to All Email Notifications",
  description:
    "Re-enable all email notification preferences for the authenticated user.",
  responses: {
    200: {
      description: "Successfully resubscribed to email notifications",
      content: {
        "application/json": {
          schema: apiResponseSchema(getUserEmailPreferencesSchema),
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
      description: "Email preferences not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Re-enables all email notifications for the authenticated user.
 * This authenticated endpoint resets all preferences to enabled and generates a new token.
 * Invalidates cache for email preferences.
 * @route POST /users/me/email-preferences/resubscribe
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated preferences.
 */
router.post(
  "/me/email-preferences/resubscribe",
  invalidateCacheMiddleware(() => "users/me/email-preferences"),
  userController.resubscribeEmailNotifications,
);

// Job Alerts routes

registry.registerPath({
  method: "post",
  path: "/users/me/job-alerts",
  tags: ["Users"],
  summary: "Create Job Alert",
  description:
    "Create a new job alert for the authenticated user. Maximum 10 active alerts allowed.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createJobAlertSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    201: {
      description: "Job alert created successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobAlertSchema),
        },
      },
    },
    400: {
      description: "Validation error or limit reached",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

/**
 * Creates a new job alert for the authenticated user.
 * This authenticated endpoint allows users to create job alerts based on search criteria.
 * Validates that user has fewer than 10 active alerts.
 * Requires user authentication and job seeker role.
 * Invalidates cache for job alerts list.
 * @route POST /users/me/job-alerts
 * @param {Object} req.body - Request body with job alert details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the created job alert.
 */
router.post(
  "/me/job-alerts",
  authMiddleware.requireUserRole,
  validate(createJobAlertSchema),
  invalidateCacheMiddleware(() => "users/me/job-alerts"),
  userController.createJobAlert,
);

registry.registerPath({
  method: "get",
  path: "/users/me/job-alerts",
  tags: ["Users"],
  summary: "Get User Job Alerts",
  description:
    "Retrieve all job alerts for the authenticated user with pagination.",
  parameters: [
    {
      name: "page",
      in: "query",
      schema: { type: "integer", default: 1 },
      description: "Page number for pagination",
    },
    {
      name: "limit",
      in: "query",
      schema: { type: "integer", default: 10 },
      description: "Number of items per page (max 50)",
    },
  ],
  responses: {
    200: {
      description: "Job alerts retrieved successfully",
      content: {
        "application/json": {
          schema: apiPaginatedResponseSchema(selectJobAlertSchema),
        },
      },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

/**
 * Retrieves all job alerts for the authenticated user with pagination.
 * This authenticated endpoint fetches the user's job alerts list.
 * Requires user authentication and job seeker role.
 * Includes caching for performance optimization.
 * @route GET /users/me/job-alerts
 * @param {Object} req.query - Query parameters for pagination.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the paginated list of job alerts.
 */
router.get(
  "/me/job-alerts",
  authMiddleware.requireUserRole,
  validate(getUserJobAlertsQuerySchema),
  cacheMiddleware({ ttl: 300 }),
  userController.getUserJobAlerts,
);

registry.registerPath({
  method: "get",
  path: "/users/me/job-alerts/{id}",
  tags: ["Users"],
  summary: "Get Job Alert by ID",
  description:
    "Retrieve a specific job alert by ID for the authenticated user.",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "integer" },
      description: "Job alert ID",
    },
  ],
  responses: {
    200: {
      description: "Job alert retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobAlertSchema),
        },
      },
    },
    404: {
      description: "Job alert not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Authentication required",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

/**
 * Retrieves a specific job alert by ID for the authenticated user.
 * This authenticated endpoint fetches details of a single job alert.
 * Requires user authentication and job seeker role.
 * Includes caching for performance optimization.
 * @route GET /users/me/job-alerts/:id
 * @param {Object} req.params - Route parameters including the alert ID.
 * @param {Response} res - Express response object.
 * @returns {Promise<ApiResponse<JobAlert>>} - Sends a JSON response with the job alert details.
 */
router.get(
  "/me/job-alerts/:id",
  authMiddleware.requireUserRole,
  validate(getJobAlertSchema),
  cacheMiddleware({ ttl: 300 }),
  userController.getJobAlertById,
);

registry.registerPath({
  method: "put",
  path: "/users/me/job-alerts/{id}",
  tags: ["Users"],
  summary: "Update Job Alert",
  description:
    "Update an existing job alert for the authenticated user. All fields are optional.",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Job alert ID",
    },
  ],
  request: {
    body: {
      description: "Job alert update data (all fields optional)",
      content: {
        "application/json": {
          schema: updateJobAlertSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Job alert updated successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobAlertSchema),
        },
      },
    },
    400: {
      description: "Validation error",
    },
    404: {
      description: "Job alert not found",
    },
  },
});

/**
 * Updates an existing job alert for the authenticated user.
 * All fields are optional - only provided fields will be updated.
 * Requires user authentication and job seeker role.
 * Invalidates cache for job alerts.
 * @route PUT /users/me/job-alerts/:id
 * @param {Object} req.params - Route parameters including the alert ID.
 * @param {Object} req.body - Request body with fields to update.
 * @param {Response} res - Express response object.
 * @returns {Promise<ApiResponse<JobAlert>>} - Updated job alert.
 */
router.put(
  "/me/job-alerts/:id",
  authMiddleware.requireUserRole,
  validate(updateJobAlertSchema),
  invalidateCacheMiddleware(() => "users/me/job-alerts"),
  userController.updateJobAlert,
);

registry.registerPath({
  method: "patch",
  path: "/users/me/job-alerts/{id}/pause",
  tags: ["Users"],
  summary: "Toggle Job Alert Pause State",
  description:
    "Toggle the pause state of a job alert. Paused alerts won't send notifications.",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Job alert ID",
    },
  ],
  request: {
    body: {
      description: "Pause state",
      content: {
        "application/json": {
          schema: togglePauseJobAlertSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Job alert pause state updated successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobAlertSchema),
        },
      },
    },
    400: {
      description: "Validation error",
    },
    404: {
      description: "Job alert not found",
    },
  },
});

/**
 * Toggles the pause state of a job alert for the authenticated user.
 * Paused alerts remain active but won't trigger notifications.
 * Requires user authentication and job seeker role.
 * Invalidates cache for job alerts.
 * @route PATCH /users/me/job-alerts/:id/pause
 * @param {Object} req.params - Route parameters including the alert ID.
 * @param {Object} req.body - Request body with isPaused boolean.
 * @param {Response} res - Express response object.
 * @returns {Promise<ApiResponse<JobAlert>>} - Updated job alert.
 */
router.patch(
  "/me/job-alerts/:id/pause",
  authMiddleware.requireUserRole,
  validate(togglePauseJobAlertSchema),
  invalidateCacheMiddleware(() => "users/me/job-alerts"),
  userController.togglePauseJobAlert,
);

registry.registerPath({
  method: "delete",
  path: "/users/me/job-alerts/{id}",
  tags: ["Users"],
  summary: "Delete Job Alert",
  description: "Delete a job alert for the authenticated user.",
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "Job alert ID",
    },
  ],
  responses: {
    204: {
      description: "Job alert deleted successfully",
    },
    404: {
      description: "Job alert not found",
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
 * Deletes a job alert for the authenticated user.
 * Permanently removes the job alert and associated data.
 * Requires user authentication and job seeker role.
 * Invalidates cache for job alerts.
 * @route DELETE /users/me/job-alerts/:id
 * @param {Object} req.params - Route parameters including the alert ID.
 * @param {Response} res - Express response object.
 * @returns {Promise<ApiResponse<null>>} - Success message.
 */
router.delete(
  "/me/job-alerts/:id",
  authMiddleware.requireUserRole,
  validate(deleteJobAlertSchema),
  invalidateCacheMiddleware(() => "users/me/job-alerts"),
  userController.deleteJobAlert,
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

/**
 * Get unsubscribe landing page data by token (public endpoint).
 * No authentication required - token-based access.
 * @route GET /users/me/email-preferences/unsubscribe/:token/info
 * @param {Object} req.params - Route parameters including the token.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends user and preference data for unsubscribe page.
 */
router.get(
  "/me/email-preferences/unsubscribe/:token/info",
  userController.getUnsubscribeLandingPageData,
);

/**
 * Unsubscribes user from specific context (job_seeker/employer/global).
 * Authenticated endpoint.
 * @route POST /users/me/email-preferences/unsubscribe-context
 * @param {Object} req.body - Request body with context.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends updated email preferences.
 */
router.post(
  "/me/email-preferences/unsubscribe-context",
  invalidateCacheMiddleware(() => "users/me/email-preferences"),
  authMiddleware.authenticate,
  userController.unsubscribeByContext,
);

/**
 * Re-subscribes user to specific context.
 * Authenticated endpoint.
 * @route POST /users/me/email-preferences/resubscribe-context
 * @param {Object} req.body - Request body with context.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends updated email preferences.
 */
router.post(
  "/me/email-preferences/resubscribe-context",
  authMiddleware.authenticate,
  userController.resubscribeByContext,
);

/**
 * Updates a granular email preference.
 * Authenticated endpoint.
 * @route PATCH /users/me/email-preferences/granular
 * @param {Object} req.body - Request body with preferenceType, enabled, and context.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends updated email preferences.
 */
router.patch(
  "/me/email-preferences/granular",
  invalidateCacheMiddleware(() => "users/me/email-preferences"),
  authMiddleware.authenticate,
  userController.updateGranularEmailPreference,
);

export default router;
