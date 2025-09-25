import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { RateLimitMiddleware } from '../middleware/rate-limit.middleware';
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
const rateLimiter = new RateLimitMiddleware();

// Rate limiting for job search
const searchRateLimit = rateLimiter.createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  maxRequests: 60, // 60 searches per minute
});

const applicationRateLimit = rateLimiter.createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes  
  maxRequests: 10, // 10 applications per 5 minutes
  keyGenerator: (req) => `${req.ip}-${req.userId || 'anonymous'}-apply`,
});

// Public routes
router.get('/', searchRateLimit, jobController.getAllJobs);
router.get('/search', searchRateLimit, validateRequest(jobSearchSchema), jobController.searchJobs);
router.get('/stats', jobController.getJobStats);
router.get('/:id', validateRequest(jobParamsSchema), jobController.getJobById);
router.get('/:id/similar', validateRequest(jobParamsSchema), jobController.getSimilarJobs);

// Protected routes - authentication required
router.use(authMiddleware.authenticate);

// User routes (authenticated users)
router.get('/recommendations/me', 
  authMiddleware.requireRole(['user']),
  jobController.getRecommendedJobs
);

router.get('/applications/my', 
  authMiddleware.requireRole(['user']),
  jobController.getUserApplications
);

router.post('/:jobId/apply',
  applicationRateLimit,
  authMiddleware.requireRole(['user']),
  validateRequest({ ...jobParamsSchema, ...jobApplicationSchema }),
  jobController.applyForJob
);

router.patch('/applications/:applicationId/withdraw',
  authMiddleware.requireRole(['user']),
  validateRequest(jobParamsSchema),
  jobController.withdrawApplication
);

// Employer routes
router.get('/my/posted',
  authMiddleware.requireRole(['employer', 'admin']),
  jobController.getMyJobs
);

router.post('/',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest(createJobSchema),
  jobController.createJob
);

router.put('/:id',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest({ ...jobParamsSchema, ...updateJobSchema }),
  jobController.updateJob
);

router.delete('/:id',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest(jobParamsSchema),
  jobController.deleteJob
);

router.get('/:jobId/applications',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest(jobParamsSchema),
  jobController.getJobApplications
);

router.patch('/applications/:applicationId/status',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest({ ...jobParamsSchema, ...updateApplicationStatusSchema }),
  jobController.updateApplicationStatus
);

// Organization-specific routes
router.get('/employer/:employerId',
  authMiddleware.requireRole(['employer', 'admin']),
  validateRequest(jobParamsSchema),
  jobController.getJobsByEmployer
);

// Dashboard routes
router.get('/dashboard/data',
  authMiddleware.requireActiveUser,
  jobController.getDashboardData
);

export default router;