import { and, desc, eq, like, or, sql, SQL } from "drizzle-orm";
import {
  jobApplications,
  jobInsights,
  jobsDetails,
  organizations,
  user,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { calculatePagination, countRecords } from "@/db/utils";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";

export class JobRepository extends BaseRepository<typeof jobsDetails> {
  constructor() {
    super(jobsDetails);
  }

  async findActiveJobs(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const items = await withDbErrorHandling(
      async () =>
        await db
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
          .offset(offset),
    );

    const total = await countRecords(
      jobsDetails,
      eq(jobsDetails.isActive, true),
    );
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
    const {
      searchTerm,
      jobType,
      location,
      experienceLevel,
      isRemote,
      page = 1,
      limit = 10,
    } = filters;
    const offset = (page - 1) * limit;

    let whereConditions: (SQL<unknown> | undefined)[] = [
      eq(jobsDetails.isActive, true),
    ];

    if (searchTerm) {
      whereConditions.push(
        or(
          like(jobsDetails.title, `%${searchTerm}%`),
          like(jobsDetails.description, `%${searchTerm}%`),
        ),
      );
    }

    if (jobType) {
      whereConditions.push(
        eq(
          jobsDetails.jobType,
          jobType as
            | "full-time"
            | "part-time"
            | "contract"
            | "volunteer"
            | "internship",
        ),
      );
    }

    if (location) {
      whereConditions.push(like(jobsDetails.location, `%${location}%`));
    }

    if (experienceLevel) {
      whereConditions.push(eq(jobsDetails.experience, experienceLevel));
    }

    if (isRemote !== undefined) {
      whereConditions.push(eq(jobsDetails.isRemote, isRemote));
    }

    const whereCondition = and(
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[]),
    );

    const items = await withDbErrorHandling(
      async () =>
        await db
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
          .offset(offset),
    );

    const total = await countRecords(jobsDetails, whereCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findJobsByEmployer(
    employerId: number,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const whereCondition = eq(jobsDetails.employerId, employerId);

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(jobsDetails)
          .where(whereCondition)
          .orderBy(desc(jobsDetails.createdAt))
          .limit(limit)
          .offset(offset),
    );

    const total = await countRecords(jobsDetails, whereCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findJobWithApplications(jobId: number) {
    return withDbErrorHandling(
      async () =>
        await db
          .select({
            job: jobsDetails,
            employer: organizations,
            applications: jobApplications,
            applicant: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
            },
          })
          .from(jobsDetails)
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
          .leftJoin(jobApplications, eq(jobsDetails.id, jobApplications.jobId))
          .leftJoin(user, eq(jobApplications.applicantId, user.id))
          .where(eq(jobsDetails.id, jobId)),
    );
  }

  // Job Applications
  async createApplication(applicationData: NewJobApplication) {
    const result = await withDbErrorHandling(async () =>
      db.transaction(async (transaction) => {
        const [applicationId] = await transaction
          .insert(jobApplications)
          .values(applicationData)
          .$returningId();

        await transaction.update(jobInsights).set({
          viewCount: sql`(${jobInsights.applicationCount} + 1)`,
        });

        return applicationId;
      }),
    );
    return result?.id;
  }

  async findApplicationsByJob(
    jobId: number,
    options: { page?: number; limit?: number; status?: string } = {},
  ) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL<unknown> | undefined)[] = [
      eq(jobApplications.jobId, jobId),
    ];
    if (status) {
      whereConditions.push(eq(jobApplications.status, status as any));
    }

    const where = and(
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[]),
    );

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select({
            application: jobApplications,
            applicant: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
            },
          })
          .from(jobApplications)
          .innerJoin(user, eq(jobApplications.applicantId, user.id))
          .where(where)
          .orderBy(desc(jobApplications.appliedAt))
          .limit(limit)
          .offset(offset),
    );

    const total = await countRecords(jobApplications, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findApplicationsByUser(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      status?:
        | "pending"
        | "reviewed"
        | "shortlisted"
        | "interviewing"
        | "rejected"
        | "hired"
        | "withdrawn";
    } = {},
  ) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL<unknown> | undefined)[] = [
      eq(jobApplications.applicantId, userId),
    ];
    if (status) {
      whereConditions.push(
        eq(
          jobApplications.status,
          status as
            | "pending"
            | "reviewed"
            | "shortlisted"
            | "interviewing"
            | "rejected"
            | "hired"
            | "withdrawn",
        ),
      );
    }

    const where = and(
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[]),
    );

    const items = await withDbErrorHandling(
      async () =>
        await db
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
          .where(where)
          .orderBy(desc(jobApplications.appliedAt))
          .limit(limit)
          .offset(offset),
    );

    const total = await countRecords(jobApplications, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async updateApplicationStatus(
    applicationId: number,
    updateData: UpdateJobApplication,
  ) {
    // const updateData: any = { status };
    // if (status === "reviewed") {
    //   updateData.reviewedAt = new Date();
    // }
    // if (notes) {
    //   updateData.notes = notes;
    // }

    const result = await withDbErrorHandling(
      async () =>
        await db
          .update(jobApplications)
          .set(updateData)
          .where(eq(jobApplications.id, applicationId)),
    );

    return (result as any).affectedRows > 0;
  }

  async findApplicationById(applicationId: number) {
    return withDbErrorHandling(
      async () =>
        await db
          .select({
            application: {
              id: jobApplications.id,
              jobId: jobApplications.jobId,
              reviewedAt: jobApplications.reviewedAt,
            },
            job: {
              id: jobsDetails.id,
              title: jobsDetails.title,
              location: jobsDetails.location,
              jobType: jobsDetails.jobType,
              employerId: jobsDetails.employerId,
            },
            user: {
              id: user.id,
            },
          })
          .from(jobApplications)
          .where(eq(jobApplications.id, applicationId))
          .innerJoin(jobsDetails, eq(jobApplications.jobId, jobsDetails.id))
          .innerJoin(user, eq(jobApplications.applicantId, user.id)),
    );
  }

  async hasUserAppliedToJob(userId: number, jobId: number) {
    return await withDbErrorHandling(
      async () =>
        await db
          .select({ exists: sql`SELECT 1` })
          .from(jobApplications)
          .where(
            and(
              eq(jobApplications.applicantId, userId),
              eq(jobApplications.jobId, jobId),
            ),
          )
          .limit(1)
          .then((result) => result.length > 0),
    );
  }

  async deleteJobApplicationsByUserId(userId: number): Promise<void> {
    return withDbErrorHandling(async () => {
      await db
        .delete(jobApplications)
        .where(eq(jobApplications.applicantId, userId));
    });
  }

  async deleteByUserId(userId: number) {
    return withDbErrorHandling(async () => {
      await db
        .delete(jobApplications)
        .where(eq(jobApplications.applicantId, userId));
    });
  }
}
