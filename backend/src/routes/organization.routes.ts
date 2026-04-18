import { Router } from "express";

import {
  createOrganizationSchema,
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
import {
  candidatePreviewSchema,
  searchCandidatesSchema,
} from "@/validations/candidate-search.validation";

import {
  createOrganizationsRoutes,
  createCandidateSearchRoutes,
} from "@/modules/organizations";
import { createOrgApplicationsRoutes } from "@/modules/applications";
import { createInvitationsRoutes } from "@/modules/invitations";

import type { CompositionRoot } from "@/composition-root";

const organizationResponse = apiResponseSchema(selectOrganizationSchema);
const paginatedOrganizationResponse = apiResponseSchema(
  selectOrganizationSchema.array(),
).extend({
  pagination: paginationMetaSchema,
});

// ─── OpenAPI Registry (documentation only) ──────────────────────────

const paginatedCandidatePreviewResponse = apiResponseSchema(
  candidatePreviewSchema.array(),
)
  .extend({
    pagination: paginationMetaSchema,
  })
  .openapi("PaginatedCandidatePreviewResponse");

registry.registerPath({
  method: "get",
  path: "/organizations/candidates/search",
  summary: "Search public candidate profiles by skill overlap",
  description:
    "Employer-facing search. Requires a job-posting role in at least one organization. Response is an allowlisted preview — contact details and private fields are never returned.",
  tags: ["Organizations"],
  security: [{ cookie: [] }],
  request: {
    query: searchCandidatesSchema.shape["query"],
  },
  responses: {
    200: {
      description: "Paginated list of matching candidate previews",
      content: {
        "application/json": {
          schema: paginatedCandidatePreviewResponse,
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
    403: {
      description: "Forbidden — insufficient permissions",
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

// ─── Route Mounting ──────────────────────────────────────────────────
//
// Dependencies are provided by the central composition root.

interface OrganizationRoutesDeps {
  authenticate: CompositionRoot["authenticate"];
  organizations: CompositionRoot["organizations"];
  applications: CompositionRoot["applications"];
  invitations: CompositionRoot["invitations"];
}

export function createOrganizationRoutes(deps: OrganizationRoutesDeps): Router {
  const router = Router();

  // 0. Candidate search (mounted first so /candidates/search is not
  // shadowed by the /:organizationId route below)
  router.use(
    createCandidateSearchRoutes({
      authenticate: deps.authenticate,
      orgGuards: deps.organizations.guards,
      controller: deps.organizations.candidateSearchController,
    }),
  );

  // 1. Organization CRUD routes
  router.use(
    createOrganizationsRoutes({
      authenticate: deps.authenticate,
      orgGuards: deps.organizations.guards,
      controller: deps.organizations.controller,
    }),
  );

  // 2. Employer application management routes
  router.use(
    createOrgApplicationsRoutes({
      authenticate: deps.authenticate,
      orgGuards: deps.organizations.guards,
      controller: deps.applications.controller,
    }),
  );

  // 3. Invitation management routes (send, cancel, view, accept)
  router.use(
    createInvitationsRoutes({
      authenticate: deps.authenticate,
      orgGuards: deps.organizations.guards,
      invitationsGuards: deps.invitations.guards,
      controller: deps.invitations.controller,
    }),
  );

  return router;
}
