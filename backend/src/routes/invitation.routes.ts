import { Router, type RequestHandler } from "express";

import validate from "../middleware/validation.middleware";
import {
  getOrganizationInvitationDetailsSchema,
  acceptOrganizationInvitationSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { apiResponseSchema, errorResponseSchema } from "@shared/types";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

import type { InvitationsModule } from "@/modules/invitations/composition-root";

// ─── OpenAPI Registry (documentation only) ──────────────────────────

// Public route - Get invitation details
registry.registerPath({
  method: "get",
  path: "/api/invitations/{organizationId}/{token}/details",
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

// Authenticated route - Accept invitation
registry.registerPath({
  method: "post",
  path: "/api/invitations/{organizationId}/{token}/accept",
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

// ─── Route Mounting ──────────────────────────────────────────────────
//
// Dependencies are provided by the central composition root.

interface InvitationRoutesDeps {
  authenticate: RequestHandler;
  invitations: InvitationsModule;
}

export function createInvitationRoutes(deps: InvitationRoutesDeps): Router {
  const router = Router();
  const { controller } = deps.invitations;

  /**
   * Gets invitation details by token (public endpoint).
   * @route GET /invitations/:organizationId/:token/details
   */
  router.get(
    "/:organizationId/:token/details",
    validate(getOrganizationInvitationDetailsSchema),
    controller.getInvitationDetails,
  );

  /**
   * Accepts an organization invitation (authenticated endpoint).
   * @route POST /invitations/:organizationId/:token/accept
   */
  router.post(
    "/:organizationId/:token/accept",
    deps.authenticate,
    validate(acceptOrganizationInvitationSchema),
    invalidateCacheMiddleware((req) => `organizations/members/${req.userId}`),
    controller.acceptInvitation,
  );

  return router;
}
