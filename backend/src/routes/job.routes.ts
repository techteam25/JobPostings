import { Router } from "express";
import { JobController } from "../controllers/job.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";
import validate from "../middleware/validation.middleware";
import {
  createJobSchema,
  updateJobSchema,
  getJobSchema,
  deleteJobSchema,
} from "../validations/job.validation";
import { searchParams } from "../validations/base.validation";
import { updateApplicationStatusSchema } from "../validations/jobApplications.validation";

const router = Router();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.get("/", jobController.getAllJobs);
router.get("/search", validate(searchParams), jobController.searchJobs);
router.get("/stats", jobController.getJobStats);
router.get("/:id", validate(getJobSchema), jobController.getJobById);
router.get(
  "/:id/similar",
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

router.post(
  "/",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(createJobSchema),
  jobController.createJob,
);

router.put(
  "/:id",
  authMiddleware.requireRole(["employer", "admin"]),
  validate(updateJobSchema),
  jobController.updateJob,
);

router.delete(
  "/:id",
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
router.get(
  "/dashboard/data",
  authMiddleware.requireActiveUser,
  jobController.getDashboardData,
);

export default router;
