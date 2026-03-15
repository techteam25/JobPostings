import { Router, type RequestHandler } from "express";

import {
  selectJobSchema,
  createJobSchema,
  getJobSchema,
  deleteJobSchema,
  updateJobSchema,
} from "@/validations/job.validation";
import { searchJobResult, searchParams } from "@/validations/base.validation";
import {
  applyForJobSchema,
  updateApplicationStatusSchema,
  getJobApplicationSchema,
  selectJobApplicationSchema,
} from "@/validations/jobApplications.validation";
import {
  getOrganizationSchema,
  selectOrganizationSchema,
} from "@/validations/organization.validation";

import { registry, z } from "@/swagger/registry";

import {
  apiResponseSchema,
  errorResponseSchema,
  paginatedResponseSchema,
  paginationMetaSchema,
} from "@shared/types";

import { createJobBoardRoutes } from "@/modules/job-board/routes/job-board.routes";
import { createApplicationsRoutes } from "@/modules/applications/routes/applications.routes";

import type { JobBoardModule } from "@/modules/job-board/composition-root";
import type { ApplicationsModule } from "@/modules/applications/composition-root";
import type { OrganizationsModule } from "@/modules/organizations/composition-root";
import type { UserProfileModule } from "@/modules/user-profile/composition-root";

// ─── OpenAPI Registry (documentation only) ──────────────────────────

const jobResponseSchema = apiResponseSchema(selectJobSchema);

registry.registerPath({
  method: "get",
  path: "/api/jobs",
  summary: "Get all job postings with optional filters",
  tags: ["Jobs"],
  request: {
    query: searchParams.shape["query"],
  },
  responses: {
    200: {
      description: "List of job postings",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z
              .object({
                job: selectJobSchema,
                employer: selectOrganizationSchema.pick({
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                }),
              })
              .array(),
          ).extend({
            pagination: paginationMetaSchema,
          }),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/jobs/search",
  summary: "Search job postings",
  tags: ["Jobs"],
  request: {
    query: searchParams.shape["query"],
  },
  responses: {
    200: {
      description: "Search results",
      content: {
        "application/json": {
          schema: paginatedResponseSchema.extend({
            data: searchJobResult.array(),
          }),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/jobs/{jobId}",
  summary: "Get job posting by ID",
  tags: ["Jobs"],
  request: { params: getJobSchema.shape["params"] },
  responses: {
    200: {
      description: "Job details",
      content: { "application/json": { schema: jobResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Job not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/jobs/me/applications",
  summary: "Get job applications for current user",
  tags: ["Jobs"],
  security: [{ cookie: [] }],
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .min(1)
        .optional()
        .default(1)
        .describe("Page number for pagination"),
      limit: z.coerce
        .number()
        .min(1)
        .max(100)
        .optional()
        .default(10)
        .describe("Number of items per page"),
      status: z
        .enum([
          "pending",
          "reviewed",
          "shortlisted",
          "interviewing",
          "rejected",
          "hired",
          "withdrawn",
        ])
        .optional()
        .describe("Filter applications by status"),
    }),
  },
  responses: {
    200: {
      description: "User applications retrieved successfully",
      content: {
        "application/json": {
          schema: paginatedResponseSchema.extend({
            data: z
              .object({
                application: selectJobApplicationSchema,
                job: z.object({
                  id: z.number(),
                  title: z.string(),
                  city: z.string(),
                  state: z.string().nullable(),
                  country: z.string().nullable(),
                  zipcode: z.string().nullable(),
                  isRemote: z.boolean(),
                  jobType: z.string(),
                }),
                employer: z.object({
                  id: z.number(),
                  name: z.string(),
                }),
              })
              .array(),
          }),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/jobs/{jobId}/apply",
  summary: "Apply for a job posting",
  tags: ["Jobs"],
  request: {
    params: applyForJobSchema.shape["params"],
    body: {
      content: {
        "application/json": { schema: applyForJobSchema.shape["body"] },
      },
    },
  },
  responses: {
    201: {
      description: "Application submitted successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({ applicationId: z.number(), message: z.string() }),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Job not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    409: {
      description: "Already applied for this job",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/jobs/applications/{applicationId}/withdraw",
  summary: "Withdraw a job application",
  tags: ["Jobs"],
  request: { params: getJobApplicationSchema.shape["params"] },
  responses: {
    200: {
      description: "Application withdrawn successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({ message: z.string() })),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Forbidden - not application owner",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Application not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/jobs",
  summary: "Create a new job posting",
  tags: ["Jobs"],
  request: {
    body: {
      content: {
        "application/json": { schema: createJobSchema.shape["body"] },
      },
    },
  },
  responses: {
    201: {
      description: "Job created successfully",
      content: { "application/json": { schema: jobResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description:
        "Forbidden - user not associated with organization or lacks permission",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Organization not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "put",
  path: "/api/jobs/{jobId}",
  summary: "Update an existing job posting",
  tags: ["Jobs"],
  request: {
    params: updateJobSchema.shape["params"],
    body: {
      content: {
        "application/json": { schema: updateJobSchema.shape["body"] },
      },
    },
  },
  responses: {
    200: {
      description: "Job updated successfully",
      content: { "application/json": { schema: jobResponseSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Job not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/jobs/{jobId}",
  summary: "Delete a job posting",
  tags: ["Jobs"],
  request: { params: deleteJobSchema.shape["params"] },
  responses: {
    200: {
      description: "Job deleted successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({ message: z.string() })),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Job not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/jobs/employer/{organizationId}/jobs",
  summary: "Get all job postings for an organization",
  tags: ["Jobs"],
  request: { params: getOrganizationSchema.shape["params"] },
  responses: {
    200: {
      description: "List of job postings for the organization",
      content: {
        "application/json": {
          schema: apiResponseSchema(selectJobSchema.array()),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/jobs/employer/{organizationId}/jobs/stats",
  summary: "Get job postings statistics for an organization",
  tags: ["Jobs"],
  request: { params: getOrganizationSchema.shape["params"] },
  responses: {
    200: {
      description: "Job postings statistics",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              totalJobs: z.number(),
              activeJobs: z.number(),
              inactiveJobs: z.number(),
              totalApplications: z.number(),
              totalViews: z.number(),
            }),
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
});

// ─── Route Mounting ──────────────────────────────────────────────────
//
// Dependencies are provided by the central composition root.

interface JobRoutesDeps {
  authenticate: RequestHandler;
  jobBoard: JobBoardModule;
  applications: ApplicationsModule;
  organizations: OrganizationsModule;
  userProfile: UserProfileModule;
}

export function createJobRoutes(deps: JobRoutesDeps): Router {
  const router = Router();

  // Applications routes MUST be mounted before job-board routes
  // so /me/applications is registered before /:jobId
  router.use(
    createApplicationsRoutes({
      authenticate: deps.authenticate,
      profileGuards: deps.userProfile.guards,
      orgGuards: deps.organizations.guards,
      appGuards: deps.applications.guards,
      controller: deps.applications.controller,
    }),
  );

  router.use(
    createJobBoardRoutes({
      authenticate: deps.authenticate,
      orgGuards: deps.organizations.guards,
      jobBoardGuards: deps.jobBoard.guards,
      controller: deps.jobBoard.controller,
    }),
  );

  return router;
}
