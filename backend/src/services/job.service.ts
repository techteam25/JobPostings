import { JobRepository } from '../repositories/job.repository';
import { BaseService } from './base.service';
import { NewJob, NewJobApplication } from '../db/schema/jobsDetails';

export interface JobSearchFilters {
  searchTerm?: string;
  jobType?: string;
  location?: string;
  experienceLevel?: string;
  isRemote?: boolean;
  page?: number;
  limit?: number;
}

export class JobService extends BaseService {
  private jobRepository: JobRepository;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
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

  async getJobById(id: number) {
    try {
      const job = await this.jobRepository.findById(id);
      if (!job) {
        throw new Error('Job not found');
      }

      return job;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJobsByEmployer(employerId: number, options: { page?: number; limit?: number } = {}) {
    try {
      return await this.jobRepository.findJobsByEmployer(employerId, options);
    } catch (error) {
      this.handleError(error);
    }
  }

  async createJob(jobData: NewJob) {
    try {
      const jobId = await this.jobRepository.create(jobData);
      return await this.getJobById(Number(jobId));
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateJob(id: number, updateData: Partial<NewJob>) {
    try {
      const success = await this.jobRepository.update(id, updateData);
      if (!success) {
        throw new Error('Failed to update job');
      }

      return await this.getJobById(id);
    } catch (error) {
      this.handleError(error);
    }
  }

  async deactivateJob(id: number) {
    try {
      const success = await this.jobRepository.update(id, { isActive: false });
      if (!success) {
        throw new Error('Failed to deactivate job');
      }

      return { message: 'Job deactivated successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }

  async activateJob(id: number) {
    try {
      const success = await this.jobRepository.update(id, { isActive: true });
      if (!success) {
        throw new Error('Failed to activate job');
      }

      return { message: 'Job activated successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }

  // Job Applications
  async applyForJob(applicationData: NewJobApplication) {
    try {
      const applicationId = await this.jobRepository.createApplication(applicationData);
      return {
        applicationId: Number(applicationId),
        message: 'Application submitted successfully',
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async getJobApplications(jobId: number) {
    try {
      return await this.jobRepository.findApplicationsByJob(jobId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getUserApplications(userId: number) {
    try {
      return await this.jobRepository.findApplicationsByUser(userId);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateApplicationStatus(applicationId: number, status: string, notes?: string) {
    try {
      const success = await this.jobRepository.updateApplicationStatus(applicationId, status, notes);
      if (!success) {
        throw new Error('Failed to update application status');
      }

      return { message: 'Application status updated successfully' };
    } catch (error) {
      this.handleError(error);
    }
  }
}