import { and, count, eq, like, or, inArray } from "drizzle-orm";
import {
  jobApplications,
  jobsDetails,
  organizationMembers,
  organizations,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { calculatePagination } from "@/db/utils";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import { DatabaseError } from "@/utils/errors";
import { NewOrganization } from "@/validations/organization.validation";

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

          const [total] = await tx
            .select({ count: count() })
            .from(organizations)
            .where(searchCondition);

          return [items, total?.count || 0];
        }),
    );
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async createOrganization(data: NewOrganization, sessionUserId: number) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.transaction(async (tx) => {
            const [orgId] = await tx
              .insert(organizations)
              .values(data)
              .$returningId();

            if (!orgId) {
              throw new Error("Failed to create and retrieve organization ID");
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

            return await tx.query.organizations.findFirst({
              where: eq(organizations.id, orgId.id),
              with: {
                members: true,
              },
            });
          }),
      );
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.resourceName}`, error);
    }
  }

  async findByContact(contactId: number) {
    return await withDbErrorHandling(
      async () =>
        await db.query.organizationMembers.findFirst({
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
        }),
    );
  }

  async canPostJobs(userId: number): Promise<boolean> {
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
    return await db
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
      .then((result) => result.length > 0);
  }

  // Get user's active organizations
  async getUserOrganizations(userId: number) {
    return db.query.organizationMembers.findMany({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.isActive, true),
      ),
      with: {
        organization: true,
      },
    });
  }

  async getOrganizationMembersByRole(
    organizationId: number,
    role: "owner" | "admin" | "recruiter",
  ) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.query.organizationMembers.findMany({
            where: and(
              eq(organizationMembers.organizationId, organizationId),
              eq(organizationMembers.role, role),
            ),
            with: {
              user: true,
              organization: true,
            },
          }), // Filter active
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch users by role: ${role}`,
        error instanceof Error ? error : undefined,
      );
    }
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
        throw new DatabaseError("Job application not found for organization");
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
        const application = await tx
          .select({
            id: jobApplications.id,
          })
          .from(jobApplications)
          .innerJoin(jobsDetails, eq(jobsDetails.id, jobApplications.jobId))
          .innerJoin(
            organizations,
            eq(organizations.id, jobsDetails.employerId),
          )
          .where(
            and(
              eq(jobApplications.id, applicationId),
              eq(jobApplications.jobId, jobId),
              eq(organizations.id, organizationId),
            ),
          )
          .limit(1);

        if (application.length === 0) {
          throw new DatabaseError(
            "No job application found for the given organization",
          );
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
          throw new DatabaseError("Job application not found for organization");
        }

        return updatedApp;
      });
    });
  }
}
