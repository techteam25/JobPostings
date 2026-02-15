import { Router } from "express";

import { OrganizationController } from "@/controllers/organization.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  getOrganizationInvitationDetailsSchema,
  acceptOrganizationInvitationSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { apiResponseSchema, errorResponseSchema } from "@/types";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

const router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

// Public route - Get invitation details
registry.registerPath({
  method: "get",
  path: "/api/invitations/{token}/details",
  summary: "Get invitation details by token",
  tags: ["Invitations"],
  request: {
    params: getOrganizationInvitationDetailsSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Invitation details retrieved successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              organizationName: z.string(),
              role: z.enum(["owner", "admin", "recruiter", "member"]),
              inviterName: z.string(),
              expiresAt: z.date(),
            }),
          ),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Invitation not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Gets invitation details by token (public endpoint).
 * This endpoint allows anyone with a valid invitation token to view invitation details
 * without authentication, enabling users to see what organization they're being invited to
 * before signing up or signing in.
 * @route GET /api/invitations/:token/details
 * @param {Object} req.params - Route parameters including the invitation token.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with invitation details.
 */
router.get(
  "/:token/details",
  validate(getOrganizationInvitationDetailsSchema),
  organizationController.getInvitationDetails,
);

// Authenticated route - Accept invitation
registry.registerPath({
  method: "post",
  path: "/api/invitations/{token}/accept",
  summary: "Accept organization invitation",
  tags: ["Invitations"],
  request: {
    params: acceptOrganizationInvitationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Invitation accepted successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              message: z.string(),
            }),
          ),
        },
      },
    },
    400: {
      description: "Invalid request or invitation expired/already processed",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized - authentication required",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Invitation not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Conflict - user already member or email mismatch",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: "Server error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Accepts an organization invitation (authenticated endpoint).
 * This endpoint requires authentication and validates that:
 * - The invitation token is valid and not expired
 * - The invitation status is 'pending'
 * - The authenticated user's email matches the invitation email
 * - The user is not already a member of the organization
 * On success, creates an organization member record and updates the invitation status.
 * @route POST /api/invitations/:token/accept
 * @param {Object} req.params - Route parameters including the invitation token.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with success message.
 */
router.post(
  "/:organizationId/:token/accept",
  authMiddleware.authenticate,
  validate(acceptOrganizationInvitationSchema),
  invalidateCacheMiddleware((req) => `organizations/members/${req.userId}`),
  organizationController.acceptInvitation,
);

export default router;
