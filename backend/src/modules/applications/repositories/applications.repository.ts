import { and, desc, eq, inArray, SQL } from "drizzle-orm";
import {
  jobApplications,
  jobsDetails,
  organizations,
  user,
} from "@/db/schema";
import { db } from "@shared/db/connection";
import { calculatePagination, countRecords } from "@shared/db/utils";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type { ApplicationsRepositoryPort } from "@/modules/applications";

export class ApplicationsRepository implements ApplicationsRepositoryPort {
  async createApplication(applicationData: NewJobApplication) {
    const result = await withDbErrorHandling(async () => {
      const [applicationId] = await db
        .insert(jobApplications)
        .values(applicationData)
        .$returningId();

      return applicationId;
    });
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
    appliedJobIds?: number[],
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

    if (appliedJobIds && appliedJobIds.length > 0) {
      whereConditions.push(inArray(jobApplications.jobId, appliedJobIds));
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
              city: jobsDetails.city,
              state: jobsDetails.state,
              country: jobsDetails.country,
              zipcode: jobsDetails.zipcode,
              isRemote: jobsDetails.isRemote,
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
    const [result] = await withDbErrorHandling(
      async () =>
        await db
          .update(jobApplications)
          .set(updateData)
          .where(eq(jobApplications.id, applicationId)),
    );

    return result.affectedRows > 0;
  }

  async findApplicationById(applicationId: number) {
    return withDbErrorHandling(async () => {
      const result = await db
        .select({
          application: {
            id: jobApplications.id,
            jobId: jobApplications.jobId,
            applicantId: jobApplications.applicantId,
            status: jobApplications.status,
            reviewedAt: jobApplications.reviewedAt,
            appliedAt: jobApplications.appliedAt,
            coverLetter: jobApplications.coverLetter,
            resumeUrl: jobApplications.resumeUrl,
          },
          job: {
            id: jobsDetails.id,
            title: jobsDetails.title,
            city: jobsDetails.city,
            state: jobsDetails.state,
            country: jobsDetails.country,
            zipcode: jobsDetails.zipcode,
            isRemote: jobsDetails.isRemote,
            jobType: jobsDetails.jobType,
            employerId: jobsDetails.employerId,
          },
          applicant: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        })
        .from(jobApplications)
        .where(eq(jobApplications.id, applicationId))
        .innerJoin(jobsDetails, eq(jobApplications.jobId, jobsDetails.id))
        .innerJoin(user, eq(jobApplications.applicantId, user.id));

      return result[0] || null;
    });
  }

  async hasUserAppliedToJob(userId: number, jobId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const result = await db
        .select()
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.applicantId, userId),
            eq(jobApplications.jobId, jobId),
          ),
        )
        .limit(1);

      return result.length > 0;
    });
  }

  async deleteJobApplicationsByUserId(userId: number): Promise<void> {
    return withDbErrorHandling(async () => {
      await db
        .delete(jobApplications)
        .where(eq(jobApplications.applicantId, userId));
    });
  }
}
