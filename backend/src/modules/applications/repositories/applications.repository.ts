import { and, count, desc, eq, inArray, SQL } from "drizzle-orm";
import {
  applicationNotes,
  jobApplications,
  jobsDetails,
  organizations,
  user,
} from "@/db/schema";
import { db } from "@shared/db/connection";
import { calculatePagination, countRecords } from "@shared/db/utils";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { DatabaseError, NotFoundError } from "@shared/errors";
import type {
  NewJobApplication,
  UpdateJobApplication,
} from "@/validations/job.validation";
import type { NewJobApplicationNote } from "@/validations/organization.validation";
import type { ApplicationsRepositoryPort } from "@/modules/applications";
import { Application } from "@/validations/jobApplications.validation";

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
      whereConditions.push(
        eq(jobApplications.status, status as Application["status"]),
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

  // ─── Employer/Organization-scoped application methods ─────────────

  private async getJobApplicationWithDetails(
    dbOrTx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    const [application] = await dbOrTx
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        resumeUrl: jobApplications.resumeUrl,
        coverLetter: jobApplications.coverLetter,
        status: jobApplications.status,
        appliedAt: jobApplications.createdAt,
        jobTitle: jobsDetails.title,
        description: jobsDetails.description,
        city: jobsDetails.city,
        state: jobsDetails.state,
        country: jobsDetails.country,
        zipcode: jobsDetails.zipcode,
        jobType: jobsDetails.jobType,
        compensationType: jobsDetails.compensationType,
        isRemote: jobsDetails.isRemote,
        isActive: jobsDetails.isActive,
        applicationDeadline: jobsDetails.applicationDeadline,
        experience: jobsDetails.experience,
        organizationId: organizations.id,
        organizationName: organizations.name,
      })
      .from(jobApplications)
      .innerJoin(jobsDetails, eq(jobsDetails.id, jobApplications.jobId))
      .innerJoin(organizations, eq(organizations.id, jobsDetails.employerId))
      .where(
        and(
          eq(jobApplications.id, applicationId),
          eq(jobApplications.jobId, jobId),
          eq(organizations.id, organizationId),
        ),
      );

    return application;
  }

  private async fetchJobApplication(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    applicationId: number,
    jobId: number,
    organizationId: number,
  ) {
    return await tx
      .select({
        id: jobApplications.id,
      })
      .from(jobApplications)
      .innerJoin(jobsDetails, eq(jobsDetails.id, jobApplications.jobId))
      .innerJoin(organizations, eq(organizations.id, jobsDetails.employerId))
      .where(
        and(
          eq(jobApplications.id, applicationId),
          eq(jobApplications.jobId, jobId),
          eq(organizations.id, organizationId),
        ),
      )
      .limit(1);
  }

  async getJobApplicationForOrganization(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    return await withDbErrorHandling(async () => {
      const application = await this.getJobApplicationWithDetails(
        db,
        organizationId,
        jobId,
        applicationId,
      );

      if (!application) {
        throw new NotFoundError("jobApplications", applicationId);
      }

      return application;
    });
  }

  updateOrgJobApplicationStatus(
    organizationId: number,
    jobId: number,
    applicationId: number,
    status:
      | "pending"
      | "reviewed"
      | "shortlisted"
      | "interviewing"
      | "rejected"
      | "hired"
      | "withdrawn",
  ) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        const application = await this.fetchJobApplication(
          tx,
          applicationId,
          jobId,
          organizationId,
        );

        if (application.length === 0) {
          throw new NotFoundError("jobApplications", applicationId);
        }

        const [result] = await tx
          .update(jobApplications)
          .set({ status })
          .where(eq(jobApplications.id, applicationId));

        if (result.affectedRows === 0) {
          throw new DatabaseError("Failed to update job application status");
        }

        const updatedApp = await this.getJobApplicationWithDetails(
          tx,
          organizationId,
          jobId,
          applicationId,
        );

        if (!updatedApp) {
          throw new DatabaseError("Failed to retrieve updated job application");
        }

        return updatedApp;
      });
    });
  }

  createJobApplicationNote(data: NewJobApplicationNote) {
    return withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const [noteId] = await tx
            .insert(applicationNotes)
            .values({
              applicationId: data.applicationId,
              userId: data.userId,
              note: data.note,
            })
            .$returningId();

          if (!noteId) {
            throw new DatabaseError("Failed to create job application note");
          }

          const applicationWithNotes = await tx.query.jobApplications.findFirst(
            {
              where: eq(jobApplications.id, data.applicationId),
              columns: {
                notes: false,
              },
              with: {
                notes: {
                  columns: {
                    note: true,
                    createdAt: true,
                  },
                },
              },
            },
          );

          if (!applicationWithNotes) {
            throw new DatabaseError(
              "Failed to retrieve job application after adding note",
            );
          }

          return {
            ...applicationWithNotes,
            notes: applicationWithNotes.notes.map((n) => ({
              note: n.note,
              createdAt: n.createdAt,
            })),
          };
        }),
    );
  }

  getNotesForJobApplication(
    organizationId: number,
    jobId: number,
    applicationId: number,
  ) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        const application = await this.fetchJobApplication(
          tx,
          applicationId,
          jobId,
          organizationId,
        );

        if (application.length === 0) {
          throw new NotFoundError("Job application", applicationId);
        }

        const applicationWithNotes = await tx.query.jobApplications.findFirst({
          where: eq(jobApplications.id, applicationId),
          with: {
            notes: {
              columns: {
                note: true,
                createdAt: true,
              },
            },
          },
        });

        if (!applicationWithNotes) {
          throw new NotFoundError("No notes found for job application");
        }

        return applicationWithNotes.notes.map((n) => ({
          note: n.note,
          createdAt: n.createdAt,
        }));
      });
    });
  }

  getJobApplicationsForOrganization(organizationId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        const org = await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);

        if (org.length === 0) {
          throw new NotFoundError("Organization", organizationId);
        }

        const job = await tx
          .select({ id: jobsDetails.id })
          .from(jobsDetails)
          .where(
            and(
              eq(jobsDetails.id, jobId),
              eq(jobsDetails.employerId, organizationId),
            ),
          )
          .limit(1);

        if (job.length === 0) {
          return [];
        }

        return tx.query.jobApplications.findMany({
          where: eq(jobApplications.jobId, jobId),
          columns: {
            status: true,
            coverLetter: true,
            resumeUrl: true,
            appliedAt: true,
            reviewedAt: true,
          },
          with: {
            applicant: {
              columns: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });
      });
    });
  }

  async getApplicationsForOrganization(
    organizationId: number,
    options: { page?: number; limit?: number },
  ) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        const { page = 1, limit = 10 } = options;
        const offset = (page - 1) * limit;

        const org = await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);

        if (org.length === 0) {
          throw new NotFoundError("Organization", organizationId);
        }

        const results = await tx
          .select({
            applicationId: jobApplications.id,
            jobId: jobApplications.jobId,
            applicantName: user.fullName,
            applicantEmail: user.email,
            status: jobApplications.status,
            coverLetter: jobApplications.coverLetter,
            resumeUrl: jobApplications.resumeUrl,
            appliedAt: jobApplications.appliedAt,
            reviewedAt: jobApplications.reviewedAt,
            jobTitle: jobsDetails.title,
            organizationId: organizations.id,
            organizationName: organizations.name,
          })
          .from(jobApplications)
          .innerJoin(jobsDetails, eq(jobsDetails.id, jobApplications.jobId))
          .innerJoin(
            organizations,
            eq(organizations.id, jobsDetails.employerId),
          )
          .innerJoin(user, eq(user.id, jobApplications.applicantId))
          .where(eq(organizations.id, organizationId))
          .orderBy(desc(jobApplications.appliedAt))
          .limit(limit)
          .offset(offset);

        const [total] = await tx
          .select({ count: count() })
          .from(jobApplications)
          .innerJoin(jobsDetails, eq(jobsDetails.id, jobApplications.jobId))
          .innerJoin(
            organizations,
            eq(organizations.id, jobsDetails.employerId),
          )
          .where(eq(organizations.id, organizationId));

        const pagination = calculatePagination(total?.count ?? 0, page, limit);

        return { items: results, pagination };
      });
    });
  }
}
