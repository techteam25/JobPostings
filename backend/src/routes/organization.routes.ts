import { Router } from "express";

import { OrganizationController } from "@/controllers/organization.controller";
import { AuthMiddleware } from "@/middleware/auth.middleware";
import { uploadMiddleware } from "@/middleware/multer.middleware";
import validate from "../middleware/validation.middleware";
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
  createOrganizationInvitationSchema_AI,
  cancelOrganizationInvitationSchema_AI,
} from "@/validations/organization.validation";
import { registry, z } from "@/swagger/registry";
import { selectOrganizationSchema } from "@/validations/organization.validation";
import {
  apiResponseSchema,
  errorResponseSchema,
  paginationMetaSchema,
} from "@/types";
import {
  getJobApplicationSchema,
  selectJobApplicationSchema,
} from "@/validations/jobApplications.validation";
import { getJobSchema } from "@/validations/job.validation";
import { getUserSchema } from "@/validations/user.validation";
import {
  cacheMiddleware,
  invalidateCacheMiddleware,
} from "@/middleware/cache.middleware";

const router = Router();
const organizationController = new OrganizationController();
const authMiddleware = new AuthMiddleware();

const organizationResponse = apiResponseSchema(selectOrganizationSchema);
const paginatedOrganizationResponse = apiResponseSchema(
  selectOrganizationSchema.array(),
).extend({
  pagination: paginationMetaSchema,
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

/**
 * Retrieves all organizations with pagination and search.
 * This public endpoint allows users to browse organizations, with support for search and pagination.
 * Includes caching for performance optimization.
 * @route GET /organizations
 * @param {Object} req.query - Query parameters for pagination and search term.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with a paginated list of organizations.
 */
router.get(
  "/",
  cacheMiddleware({ ttl: 300 }),
  organizationController.getAllOrganizations,
);

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

/**
 * Retrieves detailed information about a specific organization by its ID.
 * This public endpoint fetches organization details, including members if applicable.
 * Includes caching for performance optimization.
 * @route GET /organizations/:organizationId
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the organization details.
 */
router.get(
  "/:organizationId",
  validate(getOrganizationSchema),
  cacheMiddleware({ ttl: 300 }),
  organizationController.getOrganizationById,
);

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

/**
 * Retrieves the organization ID associated with a specific member (user) ID.
 * This public endpoint finds the organization for a given user.
 * @route GET /organizations/members/:id
 * @param {Object} req.params - Route parameters including the user id.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the organization ID.
 */
router.get(
  "/members/:id",
  validate(getUserSchema),
  organizationController.getOrganizationIdByMemberId,
);

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

/**
 * Creates a new organization and sets the authenticated user as the owner.
 * This authenticated endpoint allows users to create organizations, automatically adding them as owners.
 * Requires authentication.
 * Invalidates cache for organization listings.
 * @route POST /organizations
 * @param {Object} req.body - Request body with organization details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the created organization.
 */
router.post(
  "/",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  uploadMiddleware.organizationLogo,
  validate(createOrganizationSchema),
  invalidateCacheMiddleware(() => "/organizations"),
  organizationController.createOrganization,
);

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

/**
 * Uploads or updates the logo for a specific organization.
 * This authenticated endpoint allows organization owners or admins to upload a logo image.
 * Requires authentication and admin/owner role in the organization.
 * Invalidates cache for the specific organization.
 * @route POST /organizations/:organizationId/logo
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Object} req.body - Request body with the logo file.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated organization.
 */
router.post(
  "/:organizationId/logo",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  uploadMiddleware.organizationLogo,
  validate(uploadOrganizationLogoSchema),
  invalidateCacheMiddleware(
    (req) => `/organizations/${req.params.organizationId}`,
  ),
  organizationController.uploadOrganizationLogo,
);

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

/**
 * Updates an existing organization.
 * This authenticated endpoint allows organization owners or admins to modify organization details.
 * Requires authentication and admin/owner role in the organization.
 * Invalidates cache for organization listings and specific organization.
 * @route PUT /organizations/:organizationId
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Object} req.body - Request body with updated organization details.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated organization.
 */
router.put(
  "/:organizationId",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  validate(updateOrganizationInputSchema),
  authMiddleware.ensureIsOrganizationMember,
  invalidateCacheMiddleware(() => "/organizations"),
  invalidateCacheMiddleware(
    (req) => `/organizations/${req.params.organizationId}`,
  ),
  organizationController.updateOrganization,
);

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

/**
 * Deletes an organization.
 * This authenticated endpoint allows organization owners to delete their organizations.
 * Requires authentication and owner role in the organization.
 * Invalidates cache for organization listings and specific organization.
 * @route DELETE /organizations/:organizationId
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response confirming the organization deletion.
 */
router.delete(
  "/:organizationId",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner"]),
  validate(deleteOrganizationSchema),
  authMiddleware.ensureIsOrganizationMember,
  invalidateCacheMiddleware(() => "/organizations"),
  invalidateCacheMiddleware(
    (req) => `/organizations/${req.params.organizationId}`,
  ),
  organizationController.deleteOrganization,
);

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

/**
 * Retrieves job applications for a specific job in an organization.
 * This authenticated endpoint fetches all applications for a job posted by the organization.
 * Requires authentication, job posting role, and membership in the organization.
 * Includes caching for performance optimization.
 * @route GET /organizations/:organizationId/jobs/:jobId/applications
 * @param {Object} req.params - Route parameters including organizationId and jobId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the list of applications.
 */
router.get(
  "/:organizationId/jobs/:jobId/applications",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  authMiddleware.ensureIsOrganizationMember,
  cacheMiddleware({ ttl: 300 }),
  organizationController.getJobApplicationsForOrganization,
);

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

/**
 * Retrieves a specific job application for an organization.
 * This authenticated endpoint fetches details of a job application for a job posted by the organization.
 * Requires authentication, job posting role, and membership in the organization.
 * Includes caching for performance optimization.
 * @route GET /organizations/:organizationId/jobs/:jobId/applications/:applicationId
 * @param {Object} req.params - Route parameters including organizationId, jobId, and applicationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the job application details.
 */
router.get(
  "/:organizationId/jobs/:jobId/applications/:applicationId",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  validate(getJobApplicationSchema),
  authMiddleware.ensureIsOrganizationMember,
  cacheMiddleware({ ttl: 300 }),
  organizationController.getJobApplicationForOrganization,
);

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

/**
 * Updates the status of a job application.
 * This authenticated endpoint allows employers to change application statuses (e.g., reviewed, shortlisted).
 * Requires authentication, admin/owner role, and membership in the organization.
 * Invalidates cache for job applications and specific application.
 * @route PATCH /organizations/:organizationId/jobs/:jobId/applications/:applicationId/status
 * @param {Object} req.params - Route parameters including organizationId, jobId, and applicationId.
 * @param {Object} req.body - Request body with the new status.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the updated application.
 */
router.patch(
  "/:organizationId/jobs/:jobId/applications/:applicationId/status",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  validate(updateJobStatusInputSchema),
  authMiddleware.ensureIsOrganizationMember,
  invalidateCacheMiddleware(
    (req) =>
      `/${req.params.organizationId}/jobs/${req.params.jobId}/applications`,
  ),
  invalidateCacheMiddleware(
    (req) =>
      `/${req.params.organizationId}/jobs/${req.params.jobId}/applications/${req.params.applicationId}`,
  ),
  organizationController.updateJobApplicationStatus,
);

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

/**
 * Attaches a note to a job application.
 * This authenticated endpoint allows employers to add notes to job applications for internal tracking.
 * Requires authentication, job posting role, and membership in the organization.
 * Invalidates cache for the specific application.
 * @route POST /organizations/:organizationId/jobs/:jobId/applications/:applicationId/notes
 * @param {Object} req.params - Route parameters including organizationId, jobId, and applicationId.
 * @param {Object} req.body - Request body with the note text.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the added note.
 */
router.post(
  "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(createJobApplicationNoteSchema),
  authMiddleware.ensureIsOrganizationMember,
  invalidateCacheMiddleware(
    (req) =>
      `/${req.params.organizationId}/jobs/${req.params.jobId}/applications/${req.params.applicationId}`,
  ),
  organizationController.attachNoteToJobApplication,
);

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

/**
 * Retrieves notes for a specific job application.
 * This authenticated endpoint fetches all notes attached to a job application.
 * Requires authentication, job posting role, and membership in the organization.
 * @route GET /organizations/:organizationId/jobs/:jobId/applications/:applicationId/notes
 * @param {Object} req.params - Route parameters including organizationId, jobId, and applicationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the list of notes.
 */
router.get(
  "/:organizationId/jobs/:jobId/applications/:applicationId/notes",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  validate(getOrganizationSchema),
  validate(getJobSchema),
  validate(getJobApplicationSchema),
  authMiddleware.ensureIsOrganizationMember,
  organizationController.getNotesForJobApplication,
);

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

/**
 * Retrieves all applications for an organization with pagination.
 * This authenticated endpoint fetches all job applications for jobs posted by the organization.
 * Requires authentication, job posting role, and membership in the organization.
 * @route GET /organizations/:organizationId/applications
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Object} req.query - Query parameters for pagination.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the paginated list of applications.
 */
router.get(
  "/:organizationId/applications",
  authMiddleware.authenticate,
  authMiddleware.requireJobPostingRole(),
  authMiddleware.ensureIsOrganizationMember,
  validate(getOrganizationSchema),
  organizationController.getApplicationsForOrganization,
);

// Organization Invitation Routes (AI-generated)

registry.registerPath({
  method: "post",
  path: "/organizations/{organizationId}/invitations",
  summary: "Send invitation to join organization",
  tags: ["Organizations"],
  request: {
    params: createOrganizationInvitationSchema_AI.shape["params"],
    body: {
      content: {
        "application/json": {
          schema: createOrganizationInvitationSchema_AI.shape["body"],
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

/**
 * Sends an invitation to join an organization.
 * This authenticated endpoint allows organization owners and admins to invite new members.
 * Requires authentication, owner/admin role, and membership in the organization.
 * @route POST /organizations/:organizationId/invitations
 * @param {Object} req.params - Route parameters including the organizationId.
 * @param {Object} req.body - Request body with invitation details (email, role).
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with the invitation ID and message.
 */
router.post(
  "/:organizationId/invitations",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  authMiddleware.ensureIsOrganizationMember,
  validate(createOrganizationInvitationSchema_AI),
  organizationController.sendInvitationAI,
);

// Cancel invitation route (AI-generated)
registry.registerPath({
  method: "delete",
  path: "/api/organizations/{organizationId}/invitations/{invitationId}",
  summary: "Cancel organization invitation",
  tags: ["Organizations"],
  request: {
    params: cancelOrganizationInvitationSchema_AI.shape["params"],
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

/**
 * Cancels an organization invitation (authenticated endpoint, admin/owner only).
 * This endpoint allows organization owners and admins to cancel pending invitations.
 * Performs soft delete by updating status to 'cancelled' and preserving audit trail.
 * Requires authentication, owner/admin role, and membership in the organization.
 * @route DELETE /organizations/:organizationId/invitations/:invitationId
 * @param {Object} req.params - Route parameters including organizationId and invitationId.
 * @param {Response} res - Express response object.
 * @returns {Promise<void>} - Sends a JSON response with success message.
 */
router.delete(
  "/:organizationId/invitations/:invitationId",
  authMiddleware.authenticate,
  authMiddleware.requireAdminOrOwnerRole(["owner", "admin"]),
  authMiddleware.ensureIsOrganizationMember,
  validate(cancelOrganizationInvitationSchema_AI),
  organizationController.cancelInvitationAI,
);

export default router;
