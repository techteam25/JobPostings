import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";
import {
  applicationNotes,
  jobApplications,
  jobsDetails,
  organizationMembers,
  organizations,
  user,
  userOnBoarding,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { calculatePagination } from "@/db/utils";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import { DatabaseError, NotFoundError } from "@/utils/errors";
import {
  NewJobApplicationNote,
  NewOrganization,
} from "@/validations/organization.validation";

export class OrganizationRepository extends BaseRepository<
  typeof organizations
> {
  constructor() {
    super(organizations);
  }

  async findByName(name: string) {
    const [result] = await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(organizations)
          .where(eq(organizations.name, name)),
    );
    return result;
  }

  async searchOrganizations(
    searchTerm: string,
    options: { page?: number; limit?: number } = {},
  ) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const searchCondition = or(
      like(organizations.name, `%${searchTerm}%`),
      like(organizations.city, `%${searchTerm}%`),
      like(organizations.state, `%${searchTerm}%`),
    );

    const [items, total] = await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const items = await tx
            .select()
            .from(organizations)
            .where(searchCondition)
            .limit(limit)
            .offset(offset);

          const total = await tx.$count(organizations, searchCondition);

          return [items, total];
        }),
    );
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async createOrganization(data: NewOrganization, sessionUserId: number) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const [orgId] = await tx
            .insert(organizations)
            .values(data)
            .$returningId();

          if (!orgId) {
            throw new DatabaseError("Create organization failed");
          }

          // Add the creating user as the organization owner
          await tx
            .insert(organizationMembers)
            .values({
              organizationId: orgId.id,
              role: "owner",
              isActive: true,
              userId: sessionUserId,
            })
            .onDuplicateKeyUpdate({
              set: {
                role: "owner",
                isActive: true,
                organizationId: orgId.id,
                userId: sessionUserId,
              },
            });

          const organization = await tx.query.organizations.findFirst({
            where: eq(organizations.id, orgId.id),
            with: {
              members: true,
            },
          });

          if (!organization) {
            throw new DatabaseError("Failed to retrieve created organization");
          }

          // Update user onboarding status to complete when organization is created
          await tx
            .update(userOnBoarding)
            .set({
              intent: "employer",
              status: "completed",
            })
            .where(eq(userOnBoarding.userId, sessionUserId));

          return organization;
        }),
    );
  }

  async findByContact(contactId: number) {
    return await withDbErrorHandling(async () => {
      const orgMember = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.userId, contactId),
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              email: true,
              emailVerified: true,
              status: true,
            },
          },
        },
      });

      if (!orgMember) {
        throw new NotFoundError("Organization", contactId);
      }

      return orgMember;
    });
  }

  async canPostJobs(userId: number): Promise<boolean> {
    return withDbErrorHandling(async () => {
      const memberships = await db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.isActive, true),
        ),
        with: {
          organization: true,
        },
      });

      return memberships.some(
        (m) =>
          ["active", "trial"].includes(m.organization?.subscriptionStatus) &&
          ["owner", "admin", "recruiter"].includes(m.role),
      );
    });
  }

  async canRejectJobApplications(
    userId: number,
    organizationId: number,
  ): Promise<boolean> {
    const memberships = await db.query.organizationMembers.findMany({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.isActive, true),
      ),
      with: {
        organization: true,
      },
    });

    return memberships.some(
      (m) =>
        ["active", "trial"].includes(m.organization?.subscriptionStatus) &&
        ["owner", "admin"].includes(m.role),
    );
  }

  async checkHasElevatedRole(
    userId: number,
    roles: ("owner" | "admin" | "recruiter" | "member")[],
  ): Promise<boolean> {
    return withDbErrorHandling(
      async () =>
        await db
          .select({ exists: organizationMembers.id })
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.userId, userId),
              eq(organizationMembers.isActive, true),
              inArray(organizationMembers.role, roles),
            ),
          )
          .limit(1)
          .then((result) => result.length > 0),
    );
  }

  // Get user's active organizations
  async getUserOrganizations(userId: number) {
    return withDbErrorHandling(async () => {
      return await db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.isActive, true),
        ),
        with: {
          organization: true,
        },
      });
    });
  }

  async getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ) {
    return await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(organizationMembers)
          .innerJoin(user, eq(organizationMembers.userId, user.id))
          .innerJoin(
            organizations,
            eq(organizationMembers.organizationId, organizations.id),
          )
          .where(
            and(
              eq(organizationMembers.organizationId, organizationId),
              eq(organizationMembers.role, role),
              eq(user.status, "active"),
            ),
          ),
    );
  }

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

  updateJobApplicationStatus(
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
        // Verify application exists for the organization
        const application = await this.fetchJobApplication(
          tx,
          applicationId,
          jobId,
          organizationId,
        );

        if (application.length === 0) {
          throw new NotFoundError("jobApplications", applicationId);
        }

        // Update the status
        const [result] = await tx
          .update(jobApplications)
          .set({ status })
          .where(eq(jobApplications.id, applicationId));

        if (result.affectedRows === 0) {
          throw new DatabaseError("Failed to update job application status");
        }

        // Fetch updated application with details
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
        // Verify application exists for the organization
        const application = await this.fetchJobApplication(
          tx,
          applicationId,
          jobId,
          organizationId,
        );

        if (application.length === 0) {
          throw new NotFoundError("Job application", applicationId);
        }

        // Fetch notes for the application
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

        console.log(JSON.stringify(applicationWithNotes, null, 2));

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

  getJobApplicationsForOrganization(organizationId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        // Verify organization exists
        const org = await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);

        if (org.length === 0) {
          throw new NotFoundError("Organization", organizationId);
        }

        // Verify job exists for the organization
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

        // Fetch applications for the job
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

        // Verify organization exists
        const org = await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.id, organizationId))
          .limit(1);

        if (org.length === 0) {
          throw new NotFoundError("Organization", organizationId);
        }

        // Fetch applications for the organization's jobs

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
