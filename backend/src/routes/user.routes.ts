import { Router, type RequestHandler } from "express";
import { z } from "zod";
import {
  updateUserPayloadSchema,
  createUserPayloadSchema,
  deleteSelfSchema,
  savedJobsSchema,
  selectUserEmailPreferencesSchema,
  updateUserEmailPreferencesSchema,
} from "@/validations/user.validation";
import { registry } from "@/swagger/registry";
import {
  apiPaginatedResponseSchema,
  apiResponseSchema,
  errorResponseSchema,
} from "@shared/types";
import {
  selectUserProfileSchema,
  selectUserSchema,
} from "@/validations/userProfile.validation";
import { selectOrganizationSchema } from "@/validations/organization.validation";
import {
  createJobAlertSchema,
  selectJobAlertSchema,
  updateJobAlertSchema,
  togglePauseJobAlertSchema,
} from "@/validations/jobAlerts.validation";
import { createIdentityRoutes } from "@/modules/identity/routes/identity.routes";
import { createProfileRoutes } from "@/modules/user-profile/routes/profile.routes";
import { createNotificationsRoutes } from "@/modules/notifications/routes/notifications.routes";

import type { IdentityModule } from "@/modules/identity/composition-root";
import type { UserProfileModule } from "@/modules/user-profile/composition-root";
import type { NotificationsModule } from "@/modules/notifications/composition-root";
import type { OrganizationsModule } from "@/modules/organizations/composition-root";

const userResponseSchema = apiResponseSchema(
  selectUserSchema.extend({
    profile: selectUserProfileSchema,
  }),
);

// ─── OpenAPI Registry (documentation only) ──────────────────────────

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
          schema: apiResponseSchema(selectUserEmailPreferencesSchema),
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
          schema: apiResponseSchema(selectUserEmailPreferencesSchema),
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
          schema: apiResponseSchema(selectUserEmailPreferencesSchema),
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
          schema: apiResponseSchema(selectUserEmailPreferencesSchema),
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

// ─── Route Mounting ──────────────────────────────────────────────────
//
// Dependencies are provided by the central composition root.

interface UserRoutesDeps {
  authenticate: RequestHandler;
  identity: IdentityModule;
  userProfile: UserProfileModule;
  notifications: NotificationsModule;
  organizations: OrganizationsModule;
}

export function createUserRoutes(deps: UserRoutesDeps): Router {
  const router = Router();

  // All user routes require authentication
  router.use(deps.authenticate);

  // Delegate to module-specific routers
  router.use(
    createProfileRoutes({
      controller: deps.userProfile.controller,
      profileGuards: deps.userProfile.guards,
      identityGuards: deps.identity.guards,
      orgGuards: deps.organizations.guards,
    }),
  );
  router.use(
    createIdentityRoutes({
      controller: deps.identity.controller,
      identityGuards: deps.identity.guards,
      orgGuards: deps.organizations.guards,
    }),
  );
  router.use(
    createNotificationsRoutes({
      controller: deps.notifications.controller,
      profileGuards: deps.userProfile.guards,
    }),
  );

  return router;
}
