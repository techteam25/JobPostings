import { Router } from "express";

import { JobController } from "@/controllers/job.controller";
import { selectJobSchema, selectOrganizationSchema } from "@/db/schema";

import { AuthMiddleware } from "@/middleware/auth.middleware";

import validate from "../middleware/validation.middleware";
import {
  createJobSchema,
  updateJobSchema,
  getJobSchema,
  deleteJobSchema,
} from "@/validations/job.validation";
import { searchParams } from "@/validations/base.validation";
import { updateApplicationStatusSchema } from "@/validations/jobApplications.validation";

import { registry, z } from "@/swagger/registry";

import {
  apiResponseSchema,
  errorResponseSchema,
  paginationMetaSchema,
} from "@/types";

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
router.get("/", validate(searchParams), jobController.getAllJobs);
router.get("/search", validate(searchParams), jobController.searchJobs);
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
router.get("/:jobId", validate(getJobSchema), jobController.getJobById);
router.get(
  "/:jobId/similar",
  validate(getJobSchema),
  jobController.getSimilarJobs,
);

// Protected routes - authentication required
router.use(authMiddleware.authenticate);

// User routes (authenticated users)
router.get(
  "/recommendations/me",
  authMiddleware.requireRole(["user"]),
  jobController.getRecommendedJobs,
);

router.get(
  "/applications/my",
  authMiddleware.requireRole(["user"]),
  jobController.getUserApplications,
);

router.post(
  "/:jobId/apply",
  authMiddleware.requireRole(["user"]),
  validate(getJobSchema),
  jobController.applyForJob,
);

router.patch(
  "/applications/:applicationId/withdraw",
  authMiddleware.requireRole(["user"]),
  validate(getJobSchema),
  jobController.withdrawApplication,
);

// Employer routes
router.get(
  "/my/posted",
  authMiddleware.requireRole(["employer", "admin"]),
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
router.post(
  "/",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(createJobSchema),
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
router.put(
  "/:jobId",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(updateJobSchema),
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
router.delete(
  "/:jobId",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(deleteJobSchema),
  jobController.deleteJob,
);

router.get(
  "/:jobId/applications",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(getJobSchema),
  jobController.getJobApplications,
);

router.patch(
  "/applications/:applicationId/status",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(updateApplicationStatusSchema),
  jobController.updateApplicationStatus,
);

// Organization-specific routes
router.get(
  "/employer/:employerId",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(getJobSchema),
  jobController.getJobsByEmployer,
);

// Dashboard routes
// router.get(
//   "/dashboard/data",
//   authMiddleware.requireActiveUser,
//   jobController.getDashboardData,
// );

export default router;
