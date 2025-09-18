import { SQL } from 'drizzle-orm';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { buildPagination, countRecords, calculatePagination } from '../db/utils';

export abstract class BaseRepository<T extends MySqlTable> {
  constructor(protected table: T) {}

  async findAll(options: {
    page?: number;
    limit?: number;
    where?: SQL;
    orderBy?: SQL;
  } = {}) {
    const { page = 1, limit = 10, where, orderBy } = options;
    const { offset } = buildPagination(page, limit);

    let query = db.select().from(this.table);

    if (where) {
      query = query.where(where);
    }

    if (orderBy) {
      query = query.orderBy(orderBy);
    }

    const items = await query.limit(limit).offset(offset);
    const total = await countRecords(this.table, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findById(id: number) {
    const result = await db.select().from(this.table).where(eq(this.table.id, id));
    return result[0] || null;
  }

  async create(data: any) {
    const result = await db.insert(this.table).values(data);
    return result.insertId;
  }

  async update(id: number, data: any) {
    const result = await db.update(this.table).set(data).where(eq(this.table.id, id));
    return result.affectedRows > 0;
  }

  async delete(id: number) {
    const result = await db.delete(this.table).where(eq(this.table.id, id));
    return result.affectedRows > 0;
  }
}