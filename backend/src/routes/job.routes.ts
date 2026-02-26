import { Router } from "express";

import { JobController } from "@/controllers/job.controller";

import { AuthMiddleware } from "@/middleware/auth.middleware";

import validate from "../middleware/validation.middleware";
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
} from "@/types";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";
import { uploadMiddleware } from "@/middleware/multer.middleware";

const router = Router();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();

const jobResponseSchema = apiResponseSchema(selectJobSchema);

// Public routes

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
 * Retrieves all active job postings with optional pagination and filters.
 * This public endpoint allows users to fetch a list of active job postings, supporting pagination and various filters to narrow down results.
 * Includes caching for performance optimization.
 * @route GET /api/jobs
 * @param {Object} req.query - Query parameters including page, limit, and filter options.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with a paginated list of job postings including employer details.
 */
router.get(
  "/",
  validate(searchParams),
  cacheMiddleware({ ttl: 300 }),
  jobController.getAllJobs,
);

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
 * Searches for job postings using advanced filters and Typesense search engine.
 * This public endpoint performs a search on job postings, allowing for text search, filtering by job type, location, experience, etc., and sorting options.
 * Includes caching for performance optimization.
 * @route GET /api/jobs/search
 * @param {Object} req.query - Query parameters for search query, filters, pagination, and sorting.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with search results and pagination metadata.
 */
router.get(
  "/search",
  validate(searchParams),
  cacheMiddleware({ ttl: 300 }),
  jobController.searchJobs,
);
// router.get("/stats", jobController.getJobStats);

registry.registerPath({
  method: "get",
  path: "/api/jobs/{jobId}",
  summary: "Get job posting by ID",
  tags: ["Jobs"],
  request: {
    params: getJobSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Job details",
      content: {
        "application/json": {
          schema: jobResponseSchema,
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
      description: "Job not found",
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
 * Retrieves detailed information about a specific job posting by its ID.
 * This public endpoint fetches a single job posting, including employer information.
 * Includes caching for performance optimization.
 * @route GET /api/jobs/:jobId
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the job posting details.
 */
router.get(
  "/:jobId",
  validate(getJobSchema),
  cacheMiddleware({ ttl: 300 }),
  jobController.getJobById,
);

// Protected routes - authentication required
router.use(authMiddleware.authenticate);

// User routes (authenticated users)

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
 * Retrieves job applications submitted by the authenticated user.
 * This authenticated endpoint fetches the user's job applications with pagination and optional status filtering.
 * Requires user authentication and job seeker role.
 * Includes caching for performance optimization.
 * @route GET /api/jobs/me/applications
 * @param {Object} req.query - Query parameters for pagination and status filter.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the user's job applications.
 */
router.get(
  "/me/applications",
  authMiddleware.requireUserRole,
  cacheMiddleware({ ttl: 300 }),
  jobController.getUserApplications,
);

registry.registerPath({
  method: "post",
  path: "/api/jobs/{jobId}/apply",
  summary: "Apply for a job posting",
  tags: ["Jobs"],
  request: {
    params: applyForJobSchema.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: applyForJobSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    201: {
      description: "Application submitted successfully",
      content: {
        "application/json": {
          schema: apiResponseSchema(
            z.object({
              applicationId: z.number(),
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
      description: "Job not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: "Already applied for this job",
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
 * Allows the authenticated user to apply for a job posting.
 * This authenticated endpoint creates a new job application for the specified job.
 * Requires user authentication and jobseeker role.
 * @route POST /api/jobs/:jobId/apply
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Object} req.body - Request body with application details (cover letter, resume).
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming the application submission.
 */
router.post(
  "/:jobId/apply",
  authMiddleware.requireUserRole,
  uploadMiddleware.jobApplication,
  validate(applyForJobSchema),
  jobController.applyForJob,
);

registry.registerPath({
  method: "patch",
  path: "/api/jobs/applications/{applicationId}/withdraw",
  summary: "Withdraw a job application",
  tags: ["Jobs"],
  request: {
    params: getJobApplicationSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Application withdrawn successfully",
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
    403: {
      description: "Forbidden - not application owner",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Application not found",
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
 * Allows the authenticated user to withdraw their job application.
 * This authenticated endpoint cancels an existing job application.
 * Requires user authentication, job seeker role, and ownership of the application.
 * @route PATCH /api/jobs/applications/:applicationId/withdraw
 * @param {Object} req.params - Route parameters including the applicationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming the application withdrawal.
 */
router.patch(
  "/applications/:applicationId/withdraw",
  validate(getJobApplicationSchema),
  authMiddleware.requireUserRole,
  authMiddleware.ensureApplicationOwnership,
  jobController.withdrawApplication,
);

// Employer routes

/**
 * Retrieves job postings created by the authenticated user's organization.
 * This authenticated endpoint fetches jobs posted by the user's organization with pagination.
 * Requires authentication and job posting role.
 * Includes caching for performance optimization.
 * @route GET /api/jobs/my/posted
 * @param {Object} req.query - Query parameters for pagination.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the organization's job postings.
 */
router.get(
  "/my/posted",
  authMiddleware.requireJobPostingRole(),
  cacheMiddleware({ ttl: 300 }),
  jobController.getMyJobs,
);

registry.registerPath({
  method: "post",
  path: "/api/jobs",
  summary: "Create a new job posting",
  tags: ["Jobs"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createJobSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    201: {
      description: "Job created successfully",
      content: {
        "application/json": {
          schema: jobResponseSchema,
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
      description:
        "Forbidden - user not associated with organization or lacks permission",
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
 * Creates a new job posting for the authenticated user's organization.
 * This authenticated endpoint allows employers to post new jobs.
 * Requires authentication and job posting role.
 * Invalidates cache for job listings.
 * @route POST /api/jobs
 * @param {Object} req.body - Request body with job posting details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the created job posting.
 */
router.post(
  "/",
  authMiddleware.requireJobPostingRole(),
  validate(createJobSchema),
  invalidateCacheMiddleware((_req) => `/api/jobs`),
  jobController.createJob,
);

registry.registerPath({
  method: "put",
  path: "/api/jobs/{jobId}",
  summary: "Update an existing job posting",
  tags: ["Jobs"],
  request: {
    params: updateJobSchema.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: updateJobSchema.shape["body"],
        },
      },
    },
  },
  responses: {
    200: {
      description: "Job updated successfully",
      content: {
        "application/json": {
          schema: jobResponseSchema,
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
 * Updates an existing job posting owned by the authenticated user's organization.
 * This authenticated endpoint allows employers to modify their job postings.
 * Requires authentication, job posting role, and ownership of the job.
 * Invalidates cache for job listings.
 * @route PUT /api/jobs/:jobId
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Object} req.body - Request body with updated job details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated job posting.
 */
router.put(
  "/:jobId",
  authMiddleware.requireJobPostingRole(),
  validate(updateJobSchema),
  invalidateCacheMiddleware((_req) => `/api/jobs`),
  jobController.updateJob,
);

registry.registerPath({
  method: "delete",
  path: "/api/jobs/{jobId}",
  summary: "Delete a job posting",
  tags: ["Jobs"],
  request: {
    params: deleteJobSchema.shape["params"],
  },
  responses: {
    200: {
      description: "Job deleted successfully",
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
      description: "Job not found",
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
 * Deletes a job posting owned by the authenticated user's organization.
 * This authenticated endpoint allows employers to remove their job postings.
 * Requires authentication, ownership of the job, and delete permissions.
 * Invalidates cache for job listings and specific job.
 * @route DELETE /api/jobs/:jobId
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming the job deletion.
 */
router.delete(
  "/:jobId",
  authMiddleware.ensureJobOwnership,
  authMiddleware.requireDeleteJobPermission(),
  validate(deleteJobSchema),
  invalidateCacheMiddleware((_req) => `/api/jobs`),
  invalidateCacheMiddleware((req) => `/api/jobs/${req.params.jobId}`),
  jobController.deleteJob,
);

/**
 * Retrieves applications for a specific job posting owned by the authenticated user's organization.
 * This authenticated endpoint fetches applications for a job posted by the user's organization.
 * Requires authentication and job posting role.
 * Includes caching for performance optimization.
 * @route GET /api/jobs/:jobId/applications
 * @param {Object} req.params - Route parameters including the jobId.
 * @param {Object} req.query - Query parameters for pagination and status filter.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the job applications.
 */
router.get(
  "/:jobId/applications",
  authMiddleware.requireJobPostingRole(),
  validate(getJobSchema),
  cacheMiddleware({ ttl: 300 }),
  jobController.getJobApplications,
);

/**
 * Updates the status of a job application for the authenticated user's organization.
 * This authenticated endpoint allows employers to change application statuses (e.g., reviewed, shortlisted).
 * Requires authentication and job posting role.
 * Invalidates cache for user applications.
 * @route PATCH /api/jobs/applications/:applicationId/status
 * @param {Object} req.params - Route parameters including the applicationId.
 * @param {Object} req.body - Request body with the new status.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated application.
 */
router.patch(
  "/applications/:applicationId/status",
  authMiddleware.requireJobPostingRole(),
  validate(updateApplicationStatusSchema),
  invalidateCacheMiddleware((_req) => `/api/jobs/me/applications`),
  jobController.updateApplicationStatus,
);

// Organization-specific routes

registry.registerPath({
  method: "get",
  path: "/api/jobs/employer/{organizationId}/jobs",
  summary: "Get all job postings for an organization",
  tags: ["Jobs"],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
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
 * Retrieves job postings for a specific organization.
 * This authenticated endpoint fetches jobs posted by the specified organization with pagination and filters.
 * Requires authentication, job posting role, and membership in the organization.
 * Includes caching for performance optimization.
 * @route GET /api/jobs/employer/:organizationId/jobs
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Object} req.query - Query parameters for pagination, search, and sorting.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the organization's job postings.
 */
router.get(
  "/employer/:organizationId/jobs",
  authMiddleware.requireJobPostingRole(),
  authMiddleware.ensureIsOrganizationMember,
  validate(getOrganizationSchema),
  cacheMiddleware({ ttl: 300 }),
  jobController.getJobsByEmployer,
);

// Dashboard routes

registry.registerPath({
  method: "get",
  path: "/api/jobs/employer/{organizationId}/jobs/stats",
  summary: "Get job postings statistics for an organization",
  tags: ["Jobs"],
  request: {
    params: getOrganizationSchema.shape["params"],
  },
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
 * Retrieves job posting statistics for a specific organization.
 * This authenticated endpoint provides stats like total jobs, active jobs, applications, and views for the organization.
 * Requires authentication, job posting role, and membership in the organization.
 * @route GET /api/jobs/employer/:organizationId/jobs/stats
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with job statistics.
 */
router.get(
  "/employer/:organizationId/jobs/stats",
  authMiddleware.requireJobPostingRole(),
  authMiddleware.ensureIsOrganizationMember,
  validate(getOrganizationSchema),
  jobController.getOrganizationJobsStats,
);

export default router;
