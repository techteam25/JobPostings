import { and, count, eq, like, or } from "drizzle-orm";
import { organizationMembers, organizations } from "@/db/schema";
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
            const user = await tx
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
}
