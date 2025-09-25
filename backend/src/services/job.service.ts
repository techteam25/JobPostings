import { JobRepository } from '../repositories/job.repository';
import { UserRepository } from '../repositories/user.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { BaseService } from './base.service';
import { NewJob, NewJobApplication, Job, JobApplication } from '../db/schema/jobsDetails';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../utils/errors';
import { SecurityUtils } from '../utils/security';

export interface JobSearchFilters {
  searchTerm?: string;
  jobType?: string;
  location?: string;
  experienceLevel?: string;
  compensationType?: string;
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
}

export interface ApplicationFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export class JobService extends BaseService {
  private jobRepository: JobRepository;
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async getAllActiveJobs(options: { page?: number; limit?: number } = {}) {
    try {
      return await this.jobRepository.findActiveJobs(options);
    } catch (error) {
      this.handleError(error);
    }
  }

  async searchJobs(filters: JobSearchFilters) {
    try {
      return await this.jobRepository.searchJobs(filters);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJobById(id: number): Promise<Job> {
    try {
      const job = await this.jobRepository.findById(id);
      if (!job) {
        throw new NotFoundError('Job', id);
      }
      return job;
    } catch (error) {
      this.handleError(error);
    }
  }

  async incrementJobViews(jobId: number): Promise<void> {
    try {
      const job = await this.jobRepository.findById(jobId);
      if (job) {
        await this.jobRepository.update(jobId, {
          viewCount: job.viewCount + 1,
        });
      }
    } catch (error) {
      // Log error but don't throw - view counting shouldn't break job retrieval
      console.error('Failed to increment job views:', error);
    }
  }

  async getJobsByEmployer(
    employerId: number, 
    options: { page?: number; limit?: number } = {},
    requesterId: number,
    requesterRole: string
  ) {
    try {
      // Authorization check
      if (requesterRole !== 'admin' && requesterRole !== 'employer') {
        throw new ForbiddenError('Only employers and admins can view employer jobs');
      }

      // Additional check for employers - they can only see their own organization's jobs
      if (requesterRole === 'employer') {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester || requester.organizationId !== employerId) {
          throw new ForbiddenError('You can only view jobs for your organization');
        }
      }

      return await this.jobRepository.findJobsByEmployer(employerId, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createJob(jobData: NewJob): Promise<Job> {
    try {
      // Validate employer exists
      const employer = await this.organizationRepository.findById(jobData.employerId);
      if (!employer) {
        throw new NotFoundError('Organization', jobData.employerId);
      }

      // Validate posted by user exists
      const poster = await this.userRepository.findById(jobData.postedById);
      if (!poster) {
        throw new NotFoundError('User', jobData.postedById);
      }

      // Sanitize and process job data
      const sanitizedData = {
        ...jobData,
        title: SecurityUtils.sanitizeInput(jobData.title),
        description: SecurityUtils.sanitizeInput(jobData.description),
        location: SecurityUtils.sanitizeInput(jobData.location),
        requiredSkills: jobData.requiredSkills ? this.processSkillsArray(jobData.requiredSkills) : null,
        preferredSkills: jobData.preferredSkills ? this.processSkillsArray(jobData.preferredSkills) : null,
      };

      const jobId = await this.jobRepository.create(sanitizedData);
      return await this.getJobById(jobId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateJob(
    id: number, 
    updateData: Partial<NewJob>,
    requesterId: number,
    requesterRole: string
  ): Promise<Job> {
    try {
      const job = await this.getJobById(id);

      // Authorization check
      if (requesterRole === 'admin') {
        // Admin can update any job
      } else if (requesterRole === 'employer') {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester || requester.organizationId !== job.employerId) {
          throw new ForbiddenError('You can only update jobs for your organization');
        }
      } else {
        throw new ForbiddenError('Only employers and admins can update jobs');
      }

      // Sanitize update data
      const sanitizedData: any = { ...updateData };
      if (sanitizedData.title) {
        sanitizedData.title = SecurityUtils.sanitizeInput(sanitizedData.title);
      }
      if (sanitizedData.description) {
        sanitizedData.description = SecurityUtils.sanitizeInput(sanitizedData.description);
      }
      if (sanitizedData.location) {
        sanitizedData.location = SecurityUtils.sanitizeInput(sanitizedData.location);
      }
      if (sanitizedData.requiredSkills) {
        sanitizedData.requiredSkills = this.processSkillsArray(sanitizedData.requiredSkills);
      }
      if (sanitizedData.preferredSkills) {
        sanitizedData.preferredSkills = this.processSkillsArray(sanitizedData.preferredSkills);
      }

      const success = await this.jobRepository.update(id, sanitizedData);
      if (!success) {
        throw new AppError('Failed to update job', 500, ErrorCode.DATABASE_ERROR);
      }

      return await this.getJobById(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteJob(id: number, requesterId: number, requesterRole: string): Promise<void> {
    try {
      const job = await this.getJobById(id);

      // Authorization check (same as update)
      if (requesterRole === 'admin') {
        // Admin can delete any job
      } else if (requesterRole === 'employer') {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester || requester.organizationId !== job.employerId) {
          throw new ForbiddenError('You can only delete jobs for your organization');
        }
      } else {
        throw new ForbiddenError('Only employers and admins can delete jobs');
      }

      // Soft delete by deactivating
      const success = await this.jobRepository.update(id, { isActive: false });
      if (!success) {
        throw new AppError('Failed to delete job', 500, ErrorCode.DATABASE_ERROR);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  // Job Application Methods
  async applyForJob(applicationData: NewJobApplication): Promise<{ applicationId: number; message: string }> {
    try {
      // Check if job exists and is active
      const job = await this.getJobById(applicationData.jobId);
      if (!job.isActive) {
        throw new ValidationError('This job is no longer accepting applications');
      }

      // Check application deadline
      if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
        throw new ValidationError('The application deadline has passed');
      }

      // Check if user has already applied
      const existingApplications = await this.jobRepository.findApplicationsByUser(applicationData.applicantId);
      const hasApplied = existingApplications.some(app => app.job?.id === applicationData.jobId);
      
      if (hasApplied) {
        throw new ConflictError('You have already applied for this job');
      }

      // Sanitize application data
      const sanitizedData = {
        ...applicationData,
        coverLetter: applicationData.coverLetter ? 
          SecurityUtils.sanitizeInput(applicationData.coverLetter) : null,
        customAnswers: applicationData.customAnswers ? 
          SecurityUtils.sanitizeInput(applicationData.customAnswers) : null,
      };

      const applicationId = await this.jobRepository.createApplication(sanitizedData);

      // Update job application count
      await this.jobRepository.update(applicationData.jobId, {
        applicationCount: job.applicationCount + 1,
      });

      return {
        applicationId,
        message: 'Application submitted successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJobApplications(
    jobId: number, 
    options: ApplicationFilters = {},
    requesterId: number,
    requesterRole: string
  ) {
    try {
      const job = await this.getJobById(jobId);

      // Authorization check
      if (requesterRole === 'admin') {
        // Admin can view any job's applications
      } else if (requesterRole === 'employer') {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester || requester.organizationId !== job.employerId) {
          throw new ForbiddenError('You can only view applications for your organization jobs');
        }
      } else {
        throw new ForbiddenError('Only employers and admins can view job applications');
      }

      return await this.jobRepository.findApplicationsByJob(jobId, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserApplications(
    userId: number, 
    options: ApplicationFilters = {}
  ) {
    try {
      return await this.jobRepository.findApplicationsByUser(userId, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateApplicationStatus(
    applicationId: number,
    status: string,
    requesterId: number,
    requesterRole: string,
    additionalData?: { notes?: string; rating?: number }
  ): Promise<{ message: string }> {
    try {
      // Get application details
      const application = await this.jobRepository.findApplicationById(applicationId);
      if (!application) {
        throw new NotFoundError('Application', applicationId);
      }

      const job = await this.getJobById(application.jobId);

      // Authorization check
      if (requesterRole === 'admin') {
        // Admin can update any application
      } else if (requesterRole === 'employer') {
        const requester = await this.userRepository.findById(requesterId);
        if (!requester || requester.organizationId !== job.employerId) {
          throw new ForbiddenError('You can only update applications for your organization jobs');
        }
      } else {
        throw new ForbiddenError('Only employers and admins can update application status');
      }

      const updateData: any = { status };
      
      if (status === 'reviewed' && !application.reviewedAt) {
        updateData.reviewedAt = new Date();
        updateData.reviewedBy = requesterId;
      }

      if (additionalData?.notes) {
        updateData.notes = SecurityUtils.sanitizeInput(additionalData.notes);
      }

      if (additionalData?.rating) {
        updateData.rating = Math.min(5, Math.max(1, additionalData.rating));
      }

      const success = await this.jobRepository.updateApplicationStatus(applicationId, updateData);
      if (!success) {
        throw new AppError('Failed to update application status', 500, ErrorCode.DATABASE_ERROR);
      }

      return { message: 'Application status updated successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }

  async withdrawApplication(applicationId: number, userId: number): Promise<{ message: string }> {
    try {
      const application = await this.jobRepository.findApplicationById(applicationId);
      if (!application) {
        throw new NotFoundError('Application', applicationId);
      }

      // Check if user owns this application
      if (application.applicantId !== userId) {
        throw new ForbiddenError('You can only withdraw your own applications');
      }

      // Check if application can be withdrawn
      if (['hired', 'rejected'].includes(application.status)) {
        throw new ValidationError('Cannot withdraw application with final status');
      }

      const success = await this.jobRepository.updateApplicationStatus(applicationId, {
        status: 'withdrawn',
      });

      if (!success) {
        throw new AppError('Failed to withdraw application', 500, ErrorCode.DATABASE_ERROR);
      }

      return { message: 'Application withdrawn successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Dashboard and Statistics Methods
  async getJobStatistics() {
    try {
      return await this.jobRepository.getJobStatistics();
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserDashboard(userId: number) {
    try {
      const user = await this.userRepository.findByIdWithProfile(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const applications = await this.jobRepository.findApplicationsByUser(userId);
      const recentApplications = applications.slice(0, 5);

      // Get application statistics
      const applicationStats = {
        total: applications.length,
        pending: applications.filter(app => app.application.status === 'pending').length,
        reviewed: applications.filter(app => app.application.status === 'reviewed').length,
        shortlisted: applications.filter(app => app.application.status === 'shortlisted').length,
        interviewing: applications.filter(app => app.application.status === 'interviewing').length,
        hired: applications.filter(app => app.application.status === 'hired').length,
        rejected: applications.filter(app => app.application.status === 'rejected').length,
      };

      return {
        user,
        applications: recentApplications,
        stats: applicationStats,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getEmployerDashboard(organizationId: number) {
    try {
      const organization = await this.organizationRepository.findById(organizationId);
      if (!organization) {
        throw new NotFoundError('Organization', organizationId);
      }

      const jobs = await this.jobRepository.findJobsByEmployer(organizationId, { limit: 1000 });
      const recentJobs = jobs.items.slice(0, 5);

      // Get job statistics
      const jobStats = {
        total: jobs.items.length,
        active: jobs.items.filter(job => job.isActive).length,
        inactive: jobs.items.filter(job => !job.isActive).length,
        totalViews: jobs.items.reduce((sum, job) => sum + (job.viewCount || 0), 0),
        totalApplications: jobs.items.reduce((sum, job) => sum + (job.applicationCount || 0), 0),
      };

      // Get recent applications across all jobs
      const allApplications = await Promise.all(
        jobs.items.map(job => this.jobRepository.findApplicationsByJob(job.id))
      );
      
      const flatApplications = allApplications.flat().sort(
        (a, b) => new Date(b.application.appliedAt).getTime() - new Date(a.application.appliedAt).getTime()
      );

      const recentApplications = flatApplications.slice(0, 10);

      return {
        organization,
        jobs: recentJobs,
        applications: recentApplications,
        stats: jobStats,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getAdminDashboard() {
    try {
      const jobStats = await this.jobRepository.getJobStatistics();
      const userStats = await this.getUserCounts();
      const organizationStats = await this.getOrganizationCounts();

      // Get recent activities
      const recentJobs = await this.jobRepository.findActiveJobs({ limit: 10 });
      const recentApplications = await this.jobRepository.getRecentApplications({ limit: 20 });

      return {
        stats: {
          jobs: jobStats,
          users: userStats,
          organizations: organizationStats,
        },
        recentActivities: {
          jobs: recentJobs.items,
          applications: recentApplications,
        },
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  private async getUserCounts() {
    const allUsers = await this.userRepository.findAll({ limit: 10000 });
    const users = allUsers.items;

    return {
      total: users.length,
      active: users.filter(user => user.isActive).length,
      inactive: users.filter(user => !user.isActive).length,
      byRole: {
        users: users.filter(user => user.role === 'user').length,
        employers: users.filter(user => user.role === 'employer').length,
        admins: users.filter(user => user.role === 'admin').length,
      },
    };
  }

  private async getOrganizationCounts() {
    const allOrgs = await this.organizationRepository.findAll({ limit: 10000 });
    return {
      total: allOrgs.items.length,
    };
  }

  private processSkillsArray(skills: string): string {
    try {
      // If it's already a JSON string, validate it
      if (skills.startsWith('[') || skills.startsWith('{')) {
        JSON.parse(skills);
        return skills;
      }

      // If it's a comma-separated string, convert to JSON array
      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(Boolean);
      return JSON.stringify(skillsArray);
    } catch (error) {
      // If JSON parsing fails, treat as comma-separated string
      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(Boolean);
      return JSON.stringify(skillsArray);
    }
  }
}
