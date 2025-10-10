import { Router } from "express";

import { JobController } from "@/controllers/job.controller";
import { selectJobSchema } from "@/db/schema";

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

import { registry } from "@/swagger/registry";

import { apiResponseSchema, errorResponseSchema } from "@/types";

const router = Router();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();

const jobResponseSchema = apiResponseSchema(selectJobSchema);

// Public routes
router.get("/", validate(searchParams), jobController.getAllJobs);
router.get("/search", validate(searchParams), jobController.searchJobs);
// router.get("/stats", jobController.getJobStats);
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

router.put(
  "/:jobId",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(updateJobSchema),
  jobController.updateJob,
);

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
