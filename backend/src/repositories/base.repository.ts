import { eq, desc, SQL, sql } from "drizzle-orm";
import { MySqlTable, MySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db/connection";
import { DatabaseError, NotFoundError } from "@/utils/errors";
import { calculatePagination } from "@/db/utils";
import { PaginationMeta } from "@/types";
import { withDbErrorHandling } from "@/db/dbErrorHandler";

type TableWithId<T extends MySqlTable> = T & {
  id: MySqlColumn;
  createdAt: MySqlColumn;
};

export class BaseRepository<T extends TableWithId<MySqlTable>> {
  protected table: T;
  protected resourceName: string;

  constructor(table: T, resourceName?: string) {
    this.table = table;
    this.resourceName = resourceName || "resource";
  }

  async create(data: T["$inferInsert"]): Promise<number> {
    const [result] = await withDbErrorHandling(
      async () => await db.insert(this.table).values(data)
    );

    if (!result || result.affectedRows === 0) {
      throw new DatabaseError(`Failed to create ${this.resourceName}`);
    }
    return result.insertId;
  }

  async findById(id: number): Promise<T["$inferSelect"]> {
    const [result] = await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(this.table)
          .where(eq(this.table.id, id))
          .limit(1)
    );

    if (!result) {
      throw new NotFoundError(`${this.resourceName}`, id);
    }

    return result;
  }

  async findAll(
    options: Partial<Pick<PaginationMeta, "limit" | "page">> = {
      limit: 20,
      page: 1,
    }
  ): Promise<{ items: T["$inferSelect"][]; pagination: PaginationMeta }> {
    const { page = 1, limit = 20 } = options;
    const offset = Math.max(0, (page - 1) * limit);

    const [items, totalResult] = await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const results = await tx
            .select()
            .from(this.table)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(this.table.createdAt));

          const total = await tx
            .select({ count: sql<number>`count(*)` })
            .from(this.table);

          return [results, total];
        })
    );

    const total = totalResult[0].count;
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findByCondition(
    condition: SQL,
    options: Pick<PaginationMeta, "limit" | "page"> = { limit: 10, page: 1 }
  ): Promise<{ items: T["$inferSelect"][]; pagination: PaginationMeta }> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const [items, totalResult] = await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const results = await tx
            .select()
            .from(this.table)
            .where(condition)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(this.table.createdAt));

          const total = await tx
            .select({ count: sql<number>`count(*)` })
            .from(this.table)
            .where(condition);

          return [results, total];
        })
    );

    const total = totalResult[0].count;
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async update(id: number, data: Partial<T["$inferInsert"]>): Promise<boolean> {
    const [result] = await withDbErrorHandling(
      async () =>
        await db
          .update(this.table)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(this.table.id, id))
    );

    if (!result) {
      return false;
    }

    return result.affectedRows > 0;
  }

  async deleteById(id: number): Promise<boolean> {
    const [result] = await withDbErrorHandling(
      async () => await db.delete(this.table).where(eq(this.table.id, id))
    );

    if (!result) {
      return false;
    }

    return result.affectedRows > 0;
  }
}