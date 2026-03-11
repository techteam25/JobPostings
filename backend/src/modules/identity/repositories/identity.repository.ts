import { and, eq, ne } from "drizzle-orm";
import { user } from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import type { IdentityRepositoryPort } from "@/modules/identity";
import { db } from "@shared/db/connection";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type { User } from "@/validations/userProfile.validation";

export class IdentityRepository
  extends BaseRepository<typeof user>
  implements IdentityRepositoryPort
{
  constructor() {
    super(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await withDbErrorHandling(
      async () =>
        await db.query.user.findFirst({
          columns: {
            id: true,
            email: true,
            fullName: true,
            image: true,
            emailVerified: true,
            status: true,
            deletedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
          where: and(eq(user.email, email), ne(user.status, "deleted")),
        }),
    );
  }

  async findByIdWithPassword(id: number): Promise<User | undefined> {
    return await withDbErrorHandling(
      async () =>
        await db.query.user.findFirst({
          where: eq(user.id, id),
          columns: {
            id: true,
            email: true,
            fullName: true,
            image: true,
            emailVerified: true,
            status: true,
            deletedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
          with: {
            account: {
              columns: {
                password: true,
              },
            },
          },
        }),
    );
  }

  async findUserById(id: number) {
    return await withDbErrorHandling(
      async () =>
        await db.query.user.findFirst({
          where: eq(user.id, id),
          columns: {
            id: true,
            email: true,
            fullName: true,
            emailVerified: true,
            image: true,
            status: true,
            deletedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
    );
  }

  async deactivateUserAccount(
    id: number,
    data: { status: "active" | "deactivated" | "deleted" },
  ) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const [result] = await tx
            .update(user)
            .set({
              status: data.status,
              updatedAt: new Date(),
            })
            .where(eq(user.id, id));

          if (!result.affectedRows && result.affectedRows === 0) {
            tx.rollback();
          }

          return await tx.query.user.findFirst({
            where: eq(user.id, id),
          });
        }),
    );
  }
}
