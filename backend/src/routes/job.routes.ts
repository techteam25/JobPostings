import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import {
  createJobSchema,
  updateJobSchema,
  jobApplicationSchema,
  updateApplicationStatusSchema,
  jobParamsSchema,
  jobSearchSchema,
} from '../validations/job.validation';

const router = Router();
const jobController = new JobController();
const authMiddleware = new AuthMiddleware();

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/search', validateRequest(jobSearchSchema), jobController.searchJobs);
router.get('/:id', validateRequest(jobParamsSchema), jobController.getJobById);

// Protected routes
router.use(authMiddleware.authenticate);

// Job management routes (employer/admin only)
router.post(
  '/',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest(createJobSchema),
  jobController.createJob
);

router.put(
  '/:id',
  validateRequest({ ...jobParamsSchema, ...updateJobSchema }),
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.updateJob
);

router.patch(
  '/:id/deactivate',
  validateRequest(jobParamsSchema),
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.deactivateJob
);

router.patch(
  '/:id/activate',
  validateRequest(jobParamsSchema),
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.activateJob
);

// Job application routes
router.post(
  '/:jobId/apply',
  validateRequest({ ...jobParamsSchema, ...jobApplicationSchema }),
  authMiddleware.requireRole(['user']),
  jobController.applyForJob
);

router.get(
  '/:jobId/applications',
  validateRequest(jobParamsSchema),
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.getJobApplications
);

router.patch(
  '/applications/:applicationId/status',
  validateRequest({ ...jobParamsSchema, ...updateApplicationStatusSchema }),
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.updateApplicationStatus
);

// User application routes
router.get('/my/applications', jobController.getUserApplications);

// Employer job routes
router.get(
  '/employer/:employerId',
  validateRequest(jobParamsSchema),
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.getJobsByEmployer
);

export default router;