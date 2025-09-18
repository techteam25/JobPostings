import { eq, like, or } from 'drizzle-orm';
import { organizations, NewOrganization } from '../db/schema/organizations';
import { BaseRepository } from './base.repository';
import { db } from '../db/connection';
import { buildPagination, countRecords, calculatePagination } from '../db/utils';

export class OrganizationRepository extends BaseRepository<typeof organizations> {
  constructor() {
    super(organizations);
  }

  async findByName(name: string) {
    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.name, name));
    return result[0] || null;
  }

  async searchOrganizations(searchTerm: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const { offset } = buildPagination(page, limit);

    const searchCondition = or(
      like(organizations.name, `%${searchTerm}%`),
      like(organizations.city, `%${searchTerm}%`),
      like(organizations.state, `%${searchTerm}%`)
    );

    const items = await db
      .select()
      .from(organizations)
      .where(searchCondition)
      .limit(limit)
      .offset(offset);

    const total = await countRecords(organizations, searchCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findByContact(contactId: number) {
    const result = await db
      .select()
      .from(organizations)
      .where(eq(organizations.contact, contactId));
    return result;
  }
}