import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { jobsDetails, jobApplications, NewJob, NewJobApplication } from '../db/schema/jobsDetails';
import { users } from '../db/schema/users';
import { organizations } from '../db/schema/organizations';
import { BaseRepository } from './base.repository';
import { db } from '../db/connection';
import { buildPagination, countRecords, calculatePagination } from '../db/utils';

export class JobRepository extends BaseRepository<typeof jobsDetails> {
  constructor() {
    super(jobsDetails);
  }

  async findActiveJobs(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const { offset } = buildPagination(page, limit);

    const items = await db
      .select({
        job: jobsDetails,
        employer: {
          id: organizations.id,
          name: organizations.name,
          city: organizations.city,
          state: organizations.state,
        },
      })
      .from(jobsDetails)
      .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
      .where(eq(jobsDetails.isActive, true))
      .orderBy(desc(jobsDetails.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await countRecords(jobsDetails, eq(jobsDetails.isActive, true));
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async searchJobs(filters: {
    searchTerm?: string;
    jobType?: string;
    location?: string;
    experienceLevel?: string;
    isRemote?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { searchTerm, jobType, location, experienceLevel, isRemote, page = 1, limit = 10 } = filters;
    const { offset } = buildPagination(page, limit);

    let whereConditions = [eq(jobsDetails.isActive, true)];

    if (searchTerm) {
      whereConditions.push(
        or(
          like(jobsDetails.title, `%${searchTerm}%`),
          like(jobsDetails.description, `%${searchTerm}%`)
        )
      );
    }

    if (jobType) {
      whereConditions.push(eq(jobsDetails.jobType, jobType));
    }

    if (location) {
      whereConditions.push(like(jobsDetails.location, `%${location}%`));
    }

    if (experienceLevel) {
      whereConditions.push(eq(jobsDetails.experienceLevel, experienceLevel));
    }

    if (isRemote !== undefined) {
      whereConditions.push(eq(jobsDetails.isRemote, isRemote));
    }

    const whereCondition = and(...whereConditions);

    const items = await db
      .select({
        job: jobsDetails,
        employer: {
          id: organizations.id,
          name: organizations.name,
          city: organizations.city,
          state: organizations.state,
        },
      })
      .from(jobsDetails)
      .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
      .where(whereCondition)
      .orderBy(desc(jobsDetails.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await countRecords(jobsDetails, whereCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findJobsByEmployer(employerId: number, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const { offset } = buildPagination(page, limit);

    const whereCondition = eq(jobsDetails.employerId, employerId);

    const items = await db
      .select()
      .from(jobsDetails)
      .where(whereCondition)
      .orderBy(desc(jobsDetails.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await countRecords(jobsDetails, whereCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findJobWithApplications(jobId: number) {
    const result = await db
      .select({
        job: jobsDetails,
        employer: organizations,
        applications: jobApplications,
        applicant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(jobsDetails)
      .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
      .leftJoin(jobApplications, eq(jobsDetails.id, jobApplications.jobId))
      .leftJoin(users, eq(jobApplications.applicantId, users.id))
      .where(eq(jobsDetails.id, jobId));

    return result;
  }

  // Job Applications
  async createApplication(applicationData: NewJobApplication) {
    const result = await db.insert(jobApplications).values(applicationData);
    return result.insertId;
  }

  async findApplicationsByJob(jobId: number) {
    return await db
      .select({
        application: jobApplications,
        applicant: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(jobApplications)
      .leftJoin(users, eq(jobApplications.applicantId, users.id))
      .where(eq(jobApplications.jobId, jobId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async findApplicationsByUser(userId: number) {
    return await db
      .select({
        application: jobApplications,
        job: {
          id: jobsDetails.id,
          title: jobsDetails.title,
          location: jobsDetails.location,
          jobType: jobsDetails.jobType,
        },
        employer: {
          id: organizations.id,
          name: organizations.name,
        },
      })
      .from(jobApplications)
      .leftJoin(jobsDetails, eq(jobApplications.jobId, jobsDetails.id))
      .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
      .where(eq(jobApplications.applicantId, userId))
      .orderBy(desc(jobApplications.appliedAt));
  }

  async updateApplicationStatus(applicationId: number, status: string, notes?: string) {
    const updateData: any = { status };
    if (status === 'reviewed') {
      updateData.reviewedAt = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }

    const result = await db
      .update(jobApplications)
      .set(updateData)
      .where(eq(jobApplications.id, applicationId));

    return result.affectedRows > 0;
  }
}