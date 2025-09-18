import { Request, Response } from 'express';
import { JobService, JobSearchFilters } from '../services/job.service';
import { BaseController } from './base.controller';

interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export class JobController extends BaseController {
  private jobService: JobService;

  constructor() {
    super();
    this.jobService = new JobService();
  }

  getAllJobs = async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query;
      const options = {
        page: page && typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: limit && typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      };

      const result = await this.jobService.getAllActiveJobs(options);
      this.sendPaginatedResponse(res, result.items, result.pagination, 'Jobs retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve jobs';
      this.sendError(res, message);
    }
  };

  searchJobs = async (req: Request, res: Response) => {
    try {
      const { search, jobType, location, experienceLevel, isRemote, page, limit } = req.query;

      const filters: JobSearchFilters = {
        searchTerm: typeof search === 'string' ? search : undefined,
        jobType: typeof jobType === 'string' ? jobType : undefined,
        location: typeof location === 'string' ? location : undefined,
        experienceLevel: typeof experienceLevel === 'string' ? experienceLevel : undefined,
        isRemote: isRemote === 'true',
        page: page && typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: limit && typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      };

      const result = await this.jobService.searchJobs(filters);
      this.sendPaginatedResponse(res, result.items, result.pagination, 'Jobs retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search jobs';
      this.sendError(res, message);
    }
  };

  getJobById = async (req: Request, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Job ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const job = await this.jobService.getJobById(id);
      this.sendSuccess(res, job, 'Job retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve job';
      const statusCode = message === 'Job not found' ? 404 : 500;
      this.sendError(res, message, statusCode);
    }
  };

  getJobsByEmployer = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.employerId) {
        return this.sendError(res, 'Employer ID is required', 400);
      }
      const employerId = parseInt(req.params.employerId);
      const { page, limit } = req.query;

      // Check if user can view these jobs (employer or admin)
      if (req.user?.role !== 'admin' && req.user?.organizationId !== employerId) {
        return this.sendError(res, 'You can only view jobs for your organization', 403);
      }

      const options = {
        page: page && typeof page === 'string' ? parseInt(page, 10) : undefined,
        limit: limit && typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      };

      const result = await this.jobService.getJobsByEmployer(employerId, options);
      this.sendPaginatedResponse(res, result.items, result.pagination, 'Jobs retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve jobs';
      this.sendError(res, message);
    }
  };

  createJob = async (req: AuthRequest, res: Response) => {
    try {
      const jobData = {
        ...req.body,
        employerId: req.user?.organizationId || req.body.employerId,
      };

      const job = await this.jobService.createJob(jobData);
      this.sendSuccess(res, job, 'Job created successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create job';
      this.sendError(res, message, 400);
    }
  };

  updateJob = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Job ID is required', 400);
      }
      const id = parseInt(req.params.id);
      const updateData = req.body;

      // Check if user can update this job
      const job = await this.jobService.getJobById(id);
      if (req.user?.role !== 'admin' && req.user?.organizationId !== job.employerId) {
        return this.sendError(res, 'You can only update jobs for your organization', 403);
      }

      const updatedJob = await this.jobService.updateJob(id, updateData);
      this.sendSuccess(res, updatedJob, 'Job updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update job';
      this.sendError(res, message);
    }
  };

  deactivateJob = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Job ID is required', 400);
      }
      const id = parseInt(req.params.id);

      // Check if user can deactivate this job
      const job = await this.jobService.getJobById(id);
      if (req.user?.role !== 'admin' && req.user?.organizationId !== job.employerId) {
        return this.sendError(res, 'You can only deactivate jobs for your organization', 403);
      }

      const result = await this.jobService.deactivateJob(id);
      this.sendSuccess(res, result, 'Job deactivated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to deactivate job';
      this.sendError(res, message);
    }
  };

  activateJob = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.id) {
        return this.sendError(res, 'Job ID is required', 400);
      }
      const id = parseInt(req.params.id);

      // Check if user can activate this job
      const job = await this.jobService.getJobById(id);
      if (req.user?.role !== 'admin' && req.user?.organizationId !== job.employerId) {
        return this.sendError(res, 'You can only activate jobs for your organization', 403);
      }

      const result = await this.jobService.activateJob(id);
      this.sendSuccess(res, result, 'Job activated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to activate job';
      this.sendError(res, message);
    }
  };

  // Job Applications
  applyForJob = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.jobId) {
        return this.sendError(res, 'Job ID is required', 400);
      }
      const jobId = parseInt(req.params.jobId);
      const applicationData = {
        ...req.body,
        jobId,
        applicantId: req.userId!,
      };

      const result = await this.jobService.applyForJob(applicationData);
      this.sendSuccess(res, result, 'Application submitted successfully', 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit application';
      this.sendError(res, message, 400);
    }
  };

  getJobApplications = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.jobId) {
        return this.sendError(res, 'Job ID is required', 400);
      }
      const jobId = parseInt(req.params.jobId);

      // Check if user can view applications for this job
      const job = await this.jobService.getJobById(jobId);
      if (req.user?.role !== 'admin' && req.user?.organizationId !== job.employerId) {
        return this.sendError(res, 'You can only view applications for your organization jobs', 403);
      }

      const applications = await this.jobService.getJobApplications(jobId);
      this.sendSuccess(res, applications, 'Applications retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve applications';
      this.sendError(res, message);
    }
  };

  getUserApplications = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const applications = await this.jobService.getUserApplications(userId);
      this.sendSuccess(res, applications, 'Applications retrieved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve applications';
      this.sendError(res, message);
    }
  };

  updateApplicationStatus = async (req: AuthRequest, res: Response) => {
    try {
      if (!req.params.applicationId) {
        return this.sendError(res, 'Application ID is required', 400);
      }
      const applicationId = parseInt(req.params.applicationId);
      const { status, notes } = req.body;

      // Additional authorization logic would go here to ensure
      // only the employer can update application status

      const result = await this.jobService.updateApplicationStatus(applicationId, status, notes);
      this.sendSuccess(res, result, 'Application status updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update application status';
      this.sendError(res, message);
    }
  };
}
