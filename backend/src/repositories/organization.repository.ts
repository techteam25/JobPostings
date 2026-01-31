import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";
import {
  applicationNotes,
  jobApplications,
  jobsDetails,
  organizationMembers,
  organizations,
  organizationInvitations,
  user,
  userOnBoarding,
  userEmailPreferences,
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

/**
 * Repository class for managing organization-related database operations, including members and applications.
 */
export class OrganizationRepository extends BaseRepository<
  typeof organizations
> {
  /**
   * Creates an instance of OrganizationRepository.
   */
  constructor() {
    super(organizations);
  }

  /**
   * Finds an organization by its name.
   * @param name The name of the organization.
   * @returns The organization data.
   */
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

  /**
   * Finds an organization by its ID, including members with user details.
   * @param organizationId The ID of the organization.
   * @returns The organization with flattened member details.
   */
  async findByIdIncludingMembers(organizationId: number) {
    return await withDbErrorHandling(async () => {
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
        with: {
          members: {
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
          },
        },
      });

      if (!organization) {
        throw new NotFoundError("Organization", organizationId);
      }

      // flatten members to include user details at the top level

      return {
        ...organization,
        members: organization.members.map((member) => ({
          id: member.id,
          organizationId: member.organizationId,
          userId: member.userId,
          role: member.role,
          isActive: member.isActive,
          createdAt: member.createdAt,
          updatedAt: member.updatedAt,
          memberName: member.user.fullName,
          memberEmail: member.user.email,
          memberEmailVerified: member.user.emailVerified,
          memberStatus: member.user.status,
        })),
      };
    });
  }

  /**
   * Searches organizations by name, city, or state with pagination.
   * @param searchTerm The term to search for.
   * @param options Pagination options including page and limit.
   * @returns An object containing the organizations and pagination metadata.
   */
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

  /**
   * Creates a new organization and adds the creator as the owner.
   * @param data The organization data.
   * @param sessionUserId The ID of the user creating the organization.
   * @returns The created organization with members.
   */
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

          // Set employer email preferences for the user
          await tx
            .update(userEmailPreferences)
            .set({ matchedCandidates: true })
            .where(eq(userEmailPreferences.userId, sessionUserId));

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

  /**
   * Finds an organization member by contact (user) ID.
   * @param contactId The ID of the user.
   * @returns The organization member with user details.
   */
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

  /**
   * Checks if a user can post jobs based on their organization memberships.
   * @param userId The ID of the user.
   * @returns True if the user can post jobs, false otherwise.
   */
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

  /**
   * Checks if a user can reject job applications for a specific organization.
   * @param userId The ID of the user.
   * @param organizationId The ID of the organization.
   * @returns True if the user can reject applications, false otherwise.
   */
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

  /**
   * Checks if a user has any of the specified elevated roles in an organization.
   * @param userId The ID of the user.
   * @param roles The roles to check for.
   * @returns True if the user has any of the roles, false otherwise.
   */
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

  /**
   * Retrieves all active organizations for a user.
   * @param userId The ID of the user.
   * @returns The user's active organization memberships with organization details.
   */
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

  /**
   * Retrieves organization members by their role.
   * @param organizationId The ID of the organization.
   * @param role The role to filter by.
   * @returns The members with the specified role, including user details.
   */
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

  /**
   * Retrieves job application details with job and organization information.
   * @param dbOrTx The database instance or transaction.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @returns The application details.
   */
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

  /**
   * Retrieves a specific job application for an organization.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @returns The job application details.
   */
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

  /**
   * Updates the status of a job application.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @param status The new status for the application.
   * @returns The updated application details.
   */
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

  /**
   * Creates a note for a job application.
   * @param data The note data including application ID, user ID, and note text.
   * @returns The application with its notes.
   */
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

  /**
   * Retrieves notes for a specific job application.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @param applicationId The ID of the application.
   * @returns The notes for the application.
   */
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

  /**
   * Fetches a job application to verify its existence.
   * @param tx The database transaction.
   * @param applicationId The ID of the application.
   * @param jobId The ID of the job.
   * @param organizationId The ID of the organization.
   * @returns The application data.
   */
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

  /**
   * Retrieves job applications for a specific job in an organization.
   * @param organizationId The ID of the organization.
   * @param jobId The ID of the job.
   * @returns The applications for the job.
   */
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

  /**
   * Retrieves all applications for an organization with pagination.
   * @param organizationId The ID of the organization.
   * @param options Pagination options including page and limit.
   * @returns An object containing the applications and pagination metadata.
   */
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

  /**
   * Finds an organization member by user ID.
   * @param userId The ID of the user.
   * @returns The organization member.
   */
  async findMemberByUserId(userId: number) {
    return await withDbErrorHandling(async () => {
      const member = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.isActive, true),
        ),
      });
      return member ?? null;
    });
  }

  /**
   * Validates if an organization exists.
   * @param orgId The ID of the organization.
   * @returns True if the organization exists, false otherwise.
   */
  async validateOrganizationExists(orgId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      });
      return !!org;
    });
  }

  /**
   * Checks if a user has delete permission for an organization.
   * @param userId The ID of the user.
   * @param orgId The ID of the organization.
   * @returns True if the user has delete permission, false otherwise.
   */
  async hasDeletePermission(userId: number, orgId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const member = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, orgId),
          eq(organizationMembers.isActive, true),
        ),
      });

      if (!member) return false;

      return ["owner", "admin"].includes(member.role);
    });
  }

  // Organization Invitation Methods (AI-generated)

  /**
   * Finds an invitation by token.
   * @param token The invitation token.
   * @returns The invitation with organization and inviter details.
   */
  async findInvitationByToken(token: string) {
    return await withDbErrorHandling(async () => {
      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.token, token),
        with: {
          organization: {
            columns: {
              id: true,
              name: true,
            },
          },
          inviter: {
            columns: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });
    });
  }

  /**
   * Finds an invitation by email and organization ID.
   * @param email The invitee email.
   * @param organizationId The organization ID.
   * @returns The invitation if found.
   */
  async findInvitationByEmailAndOrg(email: string, organizationId: number) {
    return await withDbErrorHandling(async () => {
      return await db.query.organizationInvitations.findFirst({
        where: and(
          eq(organizationInvitations.email, email.toLowerCase()),
          eq(organizationInvitations.organizationId, organizationId),
        ),
      });
    });
  }

  /**
   * Creates a new invitation.
   * @param data The invitation data.
   * @returns The created invitation.
   */
  async createInvitation(data: {
    organizationId: number;
    email: string;
    role: "owner" | "admin" | "recruiter" | "member";
    token: string;
    invitedBy: number;
    expiresAt: Date;
  }) {
    return await withDbErrorHandling(async () => {
      const [insertResult] = await db
        .insert(organizationInvitations)
        .values({
          organizationId: data.organizationId,
          email: data.email.toLowerCase(),
          role: data.role,
          token: data.token,
          invitedBy: data.invitedBy,
          expiresAt: data.expiresAt,
          status: "pending",
        })
        .$returningId();

      if (!insertResult) {
        throw new DatabaseError("Failed to create invitation");
      }

      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, insertResult.id),
      });
    });
  }

  /**
   * Updates an invitation (for resend/reactivation).
   * @param invitationId The invitation ID.
   * @param data The update data.
   * @returns The updated invitation.
   */
  async updateInvitation(
    invitationId: number,
    data: {
      token: string;
      expiresAt: Date;
      status?: "pending" | "accepted" | "expired" | "cancelled";
    },
  ) {
    return await withDbErrorHandling(async () => {
      await db
        .update(organizationInvitations)
        .set({
          token: data.token,
          expiresAt: data.expiresAt,
          status: data.status || "pending",
          updatedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invitationId));

      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitationId),
      });
    });
  }

  /**
   * Updates invitation status.
   * @param invitationId The invitation ID.
   * @param data The status update data.
   * @returns The updated invitation.
   */
  async updateInvitationStatus(
    invitationId: number,
    data: {
      status: "accepted" | "cancelled" | "expired";
      acceptedAt?: Date;
      cancelledAt?: Date;
      cancelledBy?: number;
      expiredAt?: Date;
    },
  ) {
    return await withDbErrorHandling(async () => {
      await db
        .update(organizationInvitations)
        .set({
          status: data.status,
          acceptedAt: data.acceptedAt,
          cancelledAt: data.cancelledAt,
          cancelledBy: data.cancelledBy,
          expiredAt: data.expiredAt,
          updatedAt: new Date(),
        })
        .where(eq(organizationInvitations.id, invitationId));

      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitationId),
      });
    });
  }

  /**
   * Finds an invitation by ID.
   * @param invitationId The invitation ID.
   * @returns The invitation if found.
   */
  async findInvitationById(invitationId: number) {
    return await withDbErrorHandling(async () => {
      return await db.query.organizationInvitations.findFirst({
        where: eq(organizationInvitations.id, invitationId),
      });
    });
  }

  /**
   * Checks if an email is already an active member of an organization.
   * @param email The email to check.
   * @param organizationId The organization ID.
   * @returns True if email is an active member, false otherwise.
   */
  async isEmailActiveMember(email: string, organizationId: number) {
    return await withDbErrorHandling(async () => {
      const members = await db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.isActive, true),
        ),
        with: {
          user: {
            columns: {
              email: true,
            },
          },
        },
      });

      return members.some(
        (member) => member.user.email.toLowerCase() === email.toLowerCase(),
      );
    });
  }

  /**
   * Creates an organization member record.
   * @param data The member data.
   * @returns The created member.
   */
  async createMember(data: {
    userId: number;
    organizationId: number;
    role: "owner" | "admin" | "recruiter" | "member";
  }) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const [insertResult] = await tx
            .insert(organizationMembers)
            .values({
              userId: data.userId,
              organizationId: data.organizationId,
              role: data.role,
              isActive: true,
            })
            .onDuplicateKeyUpdate({
              set: {
                role: data.role,
                isActive: true,
                organizationId: data.organizationId,
                userId: data.userId,
              },
            })
            .$returningId();

          if (!insertResult) {
            throw new DatabaseError("Failed to create organization member");
          }

          // Set employer email preferences for the new member
          await tx
            .update(userEmailPreferences)
            .set({ matchedCandidates: true })
            .where(eq(userEmailPreferences.userId, data.userId));

          return await tx.query.organizationMembers.findFirst({
            where: eq(organizationMembers.id, insertResult.id),
          });
        }),
    );
  }
}
