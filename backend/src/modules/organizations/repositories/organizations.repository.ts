import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { SecurityUtils } from "@shared/utils/security";
import {
  organizationMembers,
  organizations,
  user,
  userOnBoarding,
  userEmailPreferences,
} from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import { db } from "@shared/db/connection";
import { calculatePagination } from "@shared/db/utils";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { DatabaseError, NotFoundError } from "@shared/errors";
import type { NewOrganization } from "@/validations/organization.validation";
import type { OrganizationsRepositoryPort } from "@/modules/organizations";

/**
 * Repository class for managing organization CRUD and membership operations.
 * Does NOT include invitation or employer-facing application methods
 * (those belong to their respective modules).
 */
export class OrganizationsRepository
  extends BaseRepository<typeof organizations>
  implements OrganizationsRepositoryPort
{
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

    const escaped = SecurityUtils.escapeLikePattern(searchTerm);
    const searchCondition = or(
      like(organizations.name, `%${escaped}%`),
      like(organizations.city, `%${escaped}%`),
      like(organizations.state, `%${escaped}%`),
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
   * @param organizationId The ID of the organization.
   * @returns The organization member with user details.
   */
  async findByContact(contactId: number, organizationId: number) {
    return await withDbErrorHandling(async () => {
      const orgMember = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.userId, contactId),
          eq(organizationMembers.organizationId, organizationId),
        ),
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

      return memberships.some((m) =>
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
    const memberships = await withDbErrorHandling(async () =>
      db.query.organizationMembers.findMany({
        where: and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.isActive, true),
        ),
        with: {
          organization: true,
        },
      }),
    );

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
   * Checks if a user has `delete` permission for an organization.
   * @param userId The ID of the user.
   * @param orgId The ID of the organization.
   * @returns True if the user has `delete` permission, false otherwise.
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

  /**
   * Returns active organizations where the given user is the only active
   * owner. Two-step query: (1) find orgs where user is an active owner;
   * (2) count distinct active owners per org; keep those with count === 1
   * and status === 'active'.
   */
  async findSoleOwnedOrgs(
    userId: number,
  ): Promise<{ id: number; name: string }[]> {
    return withDbErrorHandling(async () => {
      const userOwnedRows = await db
        .select({ orgId: organizationMembers.organizationId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.role, "owner"),
            eq(organizationMembers.isActive, true),
          ),
        );

      if (userOwnedRows.length === 0) return [];

      const candidateOrgIds = userOwnedRows.map((r) => r.orgId);

      const ownerCounts = await db
        .select({
          orgId: organizationMembers.organizationId,
          ownerCount: sql<number>`COUNT(DISTINCT ${organizationMembers.userId})`,
        })
        .from(organizationMembers)
        .where(
          and(
            inArray(organizationMembers.organizationId, candidateOrgIds),
            eq(organizationMembers.role, "owner"),
            eq(organizationMembers.isActive, true),
          ),
        )
        .groupBy(organizationMembers.organizationId);

      const soleOwnedOrgIds = ownerCounts
        .filter((c) => Number(c.ownerCount) === 1)
        .map((c) => c.orgId);

      if (soleOwnedOrgIds.length === 0) return [];

      return await db
        .select({ id: organizations.id, name: organizations.name })
        .from(organizations)
        .where(
          and(
            inArray(organizations.id, soleOwnedOrgIds),
            eq(organizations.status, "active"),
          ),
        );
    });
  }
}
