import { eq, desc, SQL } from "drizzle-orm";
import { MySqlTable, MySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db/connection";
import { DatabaseError } from "@/utils/errors";
import { countRecords, calculatePagination } from "@/db/utils";
import { PaginationMeta } from "@/types";

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
    try {
      const result = await db.insert(this.table).values(data);
      return result[0].insertId;
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.resourceName}`, error);
    }
  }

  async findById(id: number): Promise<T["$inferSelect"] | null> {
    try {
      const result = await db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      throw new DatabaseError(
        `Failed to find ${this.resourceName} by ID`,
        error,
      );
    }
  }

  async findAll(
    options: Partial<Pick<PaginationMeta, "limit" | "page">> = {
      limit: 10,
      page: 1,
    },
  ): Promise<{ items: T["$inferSelect"][]; pagination: PaginationMeta }> {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const items = await db
        .select()
        .from(this.table)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.table.createdAt));

      const total = await countRecords(this.table);
      const pagination = calculatePagination(total, page, limit);

      return { items, pagination };
    } catch (error) {
      throw new DatabaseError(
        `Failed to retrieve ${this.resourceName} list`,
        error,
      );
    }
  }

  async findByCondition(
    condition: SQL,
    options: Pick<PaginationMeta, "limit" | "page"> = { limit: 10, page: 1 },
  ): Promise<{ items: T["$inferSelect"][]; pagination: PaginationMeta }> {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const items = await db
        .select()
        .from(this.table)
        .where(condition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(this.table.createdAt));

      const total = await countRecords(this.table, condition);
      const pagination = calculatePagination(total, page, limit);

      return { items, pagination };
    } catch (error) {
      throw new DatabaseError(
        `Failed to find ${this.resourceName} by condition`,
        error,
      );
    }
  }

  async update(id: number, data: Partial<T["$inferInsert"]>): Promise<boolean> {
    try {
      const result = await db
        .update(this.table)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(this.table.id, id));

      return result[0].affectedRows > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to update ${this.resourceName}`, error);
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await db.delete(this.table).where(eq(this.table.id, id));

      return result[0].affectedRows > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to delete ${this.resourceName}`, error);
    }
  }
}
