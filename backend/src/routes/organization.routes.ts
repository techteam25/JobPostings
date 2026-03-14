import { Router } from "express";

import { AuthMiddleware } from "@/middleware/auth.middleware";
import {
  createOrganizationSchema,
  updateOrganizationInputSchema,
  getOrganizationSchema,
  deleteOrganizationSchema,
  updateOrganizationSchema,
  organizationJobApplicationsResponseSchema,
  updateJobStatusInputSchema,
  createJobApplicationNoteSchema,
  getOrganizationJobApplicationsSchema,
  uploadOrganizationLogoSchema,
  createOrganizationInvitationSchema,
  cancelOrganizationInvitationSchema,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { selectOrganizationSchema } from "@/validations/organization.validation";
import {
  apiResponseSchema,
  errorResponseSchema,
  paginationMetaSchema,
} from "@shared/types";
import {
  getJobApplicationSchema,
  selectJobApplicationSchema,
} from "@/validations/jobApplications.validation";
import { getJobSchema } from "@/validations/job.validation";
import { getUserSchema } from "@/validations/user.validation";

// Module imports
import { OrganizationsRepository, createOrganizationsGuards, createOrganizationsRoutes } from "@/modules/organizations";
import { ApplicationsRepository, createOrgApplicationsRoutes } from "@/modules/applications";
import { InvitationsRepository, createInvitationsGuards } from "@/modules/invitations";
import { JobBoardRepository } from "@/modules/job-board";
import { IdentityRepository } from "@/modules/identity";
import {
  JobBoardToApplicationsAdapter,
  OrganizationsToApplicationsAdapter,
  IdentityToApplicationsAdapter,
  OrganizationsToInvitationsAdapter,
  IdentityToInvitationsAdapter,
} from "@shared/adapters";
import { BullMqEventBus } from "@shared/events";
import { EmailService } from "@shared/infrastructure/email.service";
import { createInvitationsRoutes } from "@/modules/invitations/routes/invitations.routes";

const organizationResponse = apiResponseSchema(selectOrganizationSchema);
const paginatedOrganizationResponse = apiResponseSchema(
  selectOrganizationSchema.array(),
).extend({
  pagination: paginationMetaSchema,
});

// ─── OpenAPI Registry (documentation only) ──────────────────────────

// Public routes

registry.registerPath({
  method: "get",
  path: "/organizations",
  summary: "Get all organizations",
  tags: ["Organizations"],
  responses: {
    200: {
      description: "List of organizations",
      content: {
        "application/json": {
          schema: paginatedOrganizationResponse,
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

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}",
  summary: "Get organization by ID",
  tags: ["Organizations"],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Organization details",
      content: {
        "application/json": {
          schema: organizationResponse,
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
    404: {
      description: "Organization not found",
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

registry.registerPath({
  method: "get",
  path: "/organizations/members/{memberId}",
  summary: "Get organization ID by member ID",
  tags: ["Organizations"],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Organization ID",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              organizationId: z.number(),
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
    404: {
      description: "Organization member not found",
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

registry.registerPath({
  method: "post",
  path: "/organizations",
  summary: "Create a new organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createOrganizationSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Organization created",
      content: {
        "application/json": {
          schema: organizationResponse,
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
      description: "Unauthorized",
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

registry.registerPath({
  method: "post",
  path: "/organizations/{organizationId}/logo",
  summary: "Upload organization logo",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: uploadOrganizationLogoSchema.shape["params"],
    body: {
      content: {
        "multipart/form-data": {
          schema: uploadOrganizationLogoSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Organization logo uploaded",
      content: {
        "application/json": {
          schema: organizationResponse,
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
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

registry.registerPath({
  method: "put",
  path: "/organizations/{organizationId}",
  summary: "Update an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: updateOrganizationSchema.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: updateOrganizationSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Organization updated",
      content: {
        "application/json": {
          schema: organizationResponse,
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
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

registry.registerPath({
  method: "delete",
  path: "/organizations/{organizationId}",
  summary: "Delete an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: deleteOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Organization deleted",
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
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
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

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications",
  summary: "Get job applications for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
    }),
  },
  responses: {
    200: {
      description: "List of job applications",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            organizationJobApplicationsResponseSchema.array(),
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job not found",
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

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}",
  summary: "Get a job application for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
  },
  responses: {
    200: {
      description: "Job application details",
      content: {
        "application/json": {
          schema: apiResponseSchema(organizationJobApplicationsResponseSchema),
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
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

registry.registerPath({
  method: "patch",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}/status",
  summary: "Update job application status for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
    body: {
      content: {
        "application/json": {
          schema: updateJobStatusInputSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: "Job application status updated",
      content: {
        "application/json": {
          schema: apiResponseSchema(organizationJobApplicationsResponseSchema),
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
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

registry.registerPath({
  method: "post",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}/notes",
  summary: "Attach a note to a job application",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
    body: {
      content: {
        "application/json": {
          schema: createJobApplicationNoteSchema.shape["body"],
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Note attached to job application",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobApplicationSchema),
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
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

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/jobs/{jobId}/applications/{applicationId}/notes",
  summary: "Get notes for a job application",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: z.object({
      organizationId:
        getOrganizationSchema.shape["params"].shape["organizationId"],
      jobId: getJobSchema.shape["params"].shape["jobId"],
      applicationId:
        getJobApplicationSchema.shape["params"].shape["applicationId"],
    }),
  },
  responses: {
    200: {
      description: "List of notes for the job application",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z
              .object({
                note: z.string(),
                createdAt: z.date(),
              })
              .array(),
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Job application not found",
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

registry.registerPath({
  method: "get",
  path: "/organizations/{organizationId}/applications",
  summary: "Get all applications for an organization",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "List of applications for the organization",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            getOrganizationJobApplicationsSchema.array(),
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Organization not found",
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

registry.registerPath({
  method: "post",
  path: "/organizations/{organizationId}/invitations",
  summary: "Send invitation to join organization",
  tags: ["Organizations"],
  request: {
    params: createOrganizationInvitationSchema.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: createOrganizationInvitationSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    201: {
      description: "Invitation sent successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              invitationId: z.number(),
              message: z.string(),
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
    403: {
      description: "Forbidden - insufficient permissions",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Conflict - email already member",
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

registry.registerPath({
  method: "delete",
  path: "/api/organizations/{organizationId}/invitations/{invitationId}",
  summary: "Cancel organization invitation",
  tags: ["Organizations"],
  request: {
    params: cancelOrganizationInvitationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Invitation cancelled successfully",
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
      description: "Invalid request or invitation already accepted/cancelled",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden - insufficient permissions",
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

// ─── Route Mounting (Composition Root) ──────────────────────────────
//
// All dependencies are instantiated here and passed to factory functions.
// No `new` calls should exist inside the factory functions themselves.

const router = Router();
const authMiddleware = new AuthMiddleware();

// Module-owned dependencies
const organizationsRepository = new OrganizationsRepository();
const applicationsRepository = new ApplicationsRepository();
const jobBoardRepository = new JobBoardRepository();
const identityRepository = new IdentityRepository();
const invitationsRepository = new InvitationsRepository();

// Cross-module adapters (ACLs)
const jobDetailsQuery = new JobBoardToApplicationsAdapter(jobBoardRepository);
const orgMembershipQuery = new OrganizationsToApplicationsAdapter(organizationsRepository);
const applicantQuery = new IdentityToApplicationsAdapter(identityRepository);
const orgMembership = new OrganizationsToInvitationsAdapter(organizationsRepository);
const userEmailQuery = new IdentityToInvitationsAdapter(identityRepository);

// Module-owned guards
const orgGuards = createOrganizationsGuards({ organizationsRepository });
const invitationsGuards = createInvitationsGuards({ invitationsRepository });

// Shared infrastructure
const eventBus = new BullMqEventBus();
const emailService = new EmailService();

// 1. Organization CRUD routes
router.use(
  createOrganizationsRoutes({
    authenticate: authMiddleware.authenticate,
    orgGuards,
    organizationsRepository,
  }),
);

// 2. Employer application management routes
router.use(
  createOrgApplicationsRoutes({
    authenticate: authMiddleware.authenticate,
    orgGuards,
    applicationsRepository,
    orgMembershipQuery,
    applicantQuery,
    jobDetailsQuery,
    eventBus,
  }),
);

// 3. Invitation management routes (send, cancel, view, accept)
router.use(
  createInvitationsRoutes({
    authenticate: authMiddleware.authenticate,
    orgGuards,
    invitationsGuards,
    invitationsRepository,
    orgMembership,
    userEmailQuery,
    emailService,
  }),
);

export default router;
