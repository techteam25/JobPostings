import { Router } from "express";

import { AuthMiddleware } from "@/middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  getOrganizationInvitationDetailsSchema,
  acceptOrganizationInvitationSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { apiResponseSchema, errorResponseSchema } from "@shared/types";
import { invalidateCacheMiddleware } from "@/middleware/cache.middleware";

// Module imports
import { InvitationsRepository, InvitationsService, InvitationsController } from "@/modules/invitations";
import { OrganizationsRepository } from "@/modules/organizations";
import { IdentityRepository } from "@/modules/identity";
import {
  OrganizationsToInvitationsAdapter,
  IdentityToInvitationsAdapter,
} from "@shared/adapters";
import { EmailService } from "@shared/infrastructure/email.service";

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

// ─── Route Mounting (Composition Root) ──────────────────────────────

const router = Router();
const authMiddleware = new AuthMiddleware();

// Module-owned dependencies
const organizationsRepository = new OrganizationsRepository();
const identityRepository = new IdentityRepository();
const invitationsRepository = new InvitationsRepository();

// Cross-module adapters (ACLs)
const orgMembership = new OrganizationsToInvitationsAdapter(organizationsRepository);
const userEmailQuery = new IdentityToInvitationsAdapter(identityRepository);

// Shared infrastructure
const emailService = new EmailService();

// Invitations service + controller
const invitationsService = new InvitationsService(
  invitationsRepository,
  orgMembership,
  userEmailQuery,
  emailService,
);
const invitationsController = new InvitationsController(invitationsService);

/**
 * Gets invitation details by token (public endpoint).
 * @route GET /invitations/:organizationId/:token/details
 */
router.get(
  "/:organizationId/:token/details",
  validate(getOrganizationInvitationDetailsSchema),
  invitationsController.getInvitationDetails,
);

/**
 * Accepts an organization invitation (authenticated endpoint).
 * @route POST /invitations/:organizationId/:token/accept
 */
router.post(
  "/:organizationId/:token/accept",
  authMiddleware.authenticate,
  validate(acceptOrganizationInvitationSchema),
  invalidateCacheMiddleware((req) => `organizations/members/${req.userId}`),
  invitationsController.acceptInvitation,
);

export default router;
