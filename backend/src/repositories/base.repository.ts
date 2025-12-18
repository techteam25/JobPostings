import { eq, desc } from "drizzle-orm";
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

/**
 * Abstract base repository class providing common CRUD operations for database tables.
 */
export class BaseRepository<T extends TableWithId<MySqlTable>> {
  protected table: T;
  protected resourceName: string;

  /**
   * Creates an instance of BaseRepository.
   * @param table The Drizzle table schema.
   * @param resourceName The name of the resource for error messages.
   */
  constructor(table: T, resourceName?: string) {
    this.table = table;
    this.resourceName = resourceName || "resource";
  }

  /**
   * Creates a new record in the table.
   * @param data The data to insert.
   * @returns The ID of the created record.
   */
  async create(data: T["$inferInsert"]): Promise<number> {
    const [result] = await withDbErrorHandling(
      async () => await db.insert(this.table).values(data),
    );

    if (!result || result.affectedRows === 0) {
      throw new DatabaseError(`Failed to create ${this.resourceName}`);
    }
    return result.insertId;
  }

  /**
   * Finds a record by its ID.
   * @param id The ID of the record to find.
   * @returns The found record.
   * @throws NotFoundError if the record is not found.
   */
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
      throw new NotFoundError(`${this.resourceName}`, id);
    }

    return result;
  }

  /**
   * Finds all records with pagination.
   * @param options Pagination options including page and limit.
   * @returns An object containing the items and pagination metadata.
   */
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

  /**
   * Updates a record by its ID.
   * @param id The ID of the record to update.
   * @param data The data to update.
   * @returns True if the update was successful, false otherwise.
   */
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

    if (!result) {
      return false;
    }

    return result.affectedRows > 0;
  }

  /**
   * Deletes a record by its ID.
   * @param id The ID of the record to delete.
   * @returns True if the deletion was successful, false otherwise.
   */
  async delete(id: number): Promise<boolean> {
    const [result] = await withDbErrorHandling(
      async () => await db.delete(this.table).where(eq(this.table.id, id)),
    );

    if (!result) {
      return false;
    }

    return result.affectedRows > 0;
  }
}
