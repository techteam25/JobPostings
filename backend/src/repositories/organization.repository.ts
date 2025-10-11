import { count, eq, like, or } from "drizzle-orm";
import { organizations } from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { calculatePagination, countRecords } from "@/db/utils";
import { withDbErrorHandling } from "@/db/dbErrorHandler";

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

  async findByContact(contactId: number) {
    return await withDbErrorHandling(
      async () =>
        await db.query.organizations.findFirst({
          where: eq(organizations.contact, contactId),
          with: {
            contact: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                organizationId: true,
                isEmailVerified: true,
                isActive: true,
              },
            },
          },
        }),
    );
  }
}
