import { eq, desc } from "drizzle-orm";
import { MySqlTable, MySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db/connection";
import { DatabaseError } from "@/utils/errors";
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
      async () => await db.insert(this.table).values(data),
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
          .limit(1),
    );

    if (!result || result.length === 0) {
      throw new DatabaseError(`Failed to find ${this.resourceName} by Id`);
    }

    return result;
  }

  async findAll(
    options: Partial<Pick<PaginationMeta, "limit" | "page">> = {
      limit: 20,
      page: 1,
    },
  ): Promise<{ items: T["$inferSelect"][]; pagination: PaginationMeta }> {
    const { page = 1, limit = 20 } = options;
    const offset = Math.max(0, (page - 1) * limit);

    const [items, total] = await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const results = await tx
            .select()
            .from(this.table)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(this.table.createdAt));

          const total = await tx.$count(this.table);

          return [results, total];
        }),
    );

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
          .where(eq(this.table.id, id)),
    );

    if (!result || result.affectedRows === 0) {
      throw new DatabaseError(`Failed to update ${this.resourceName}`);
    }

    return result.affectedRows > 0;
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await withDbErrorHandling(
      async () => await db.delete(this.table).where(eq(this.table.id, id)),
    );

    if (!result || result.affectedRows === 0) {
      throw new DatabaseError(`Failed to delete ${this.resourceName}`);
    }

    return result.affectedRows > 0;
  }
}
