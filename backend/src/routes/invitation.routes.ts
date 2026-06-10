import { Router } from "express";

import validate from "../middleware/validation.middleware";
import {
  getOrganizationInvitationDetailsSchema,
  acceptOrganizationInvitationSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { apiResponseSchema, errorResponseSchema } from "@shared/types";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";
import { cacheKeys } from "@shared/infrastructure/cache-keys";
import { auditRead } from "@/middleware/audit-read.middleware";

import type { CompositionRoot } from "@/composition-root";

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
  authenticate: CompositionRoot["authenticate"];
  invitations: CompositionRoot["invitations"];
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
    auditRead("read.invitation.by_token", (req) => ({
      type: "invitation",
      id: String(req.params.organizationId),
    })),
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
    invalidateCacheMiddleware((req) => cacheKeys.orgMembersOfUser(req.userId)),
    // Accepting an invite adds a membership to the user's org list. This is
    // the accept route the frontend actually calls (mounted at /invitations);
    // keep these invalidations in sync with the org-mounted accept route in
    // modules/invitations/routes/invitations.routes.ts.
    invalidateCacheMiddleware(() => cacheKeys.userOrganizations),
    controller.acceptInvitation,
  );

  return router;
}
