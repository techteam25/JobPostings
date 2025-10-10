import { and, count, eq, like, or } from "drizzle-orm";
import { NewUser, NewUserProfile, User, userProfile, users } from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { DatabaseError } from "@/utils/errors";

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

  async findByEmailWithPassword(email: string) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.email, email),
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user by email: ${email}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
      return await db.query.users.findFirst({
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true,
          isEmailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        where: eq(users.email, email),
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user by email: ${email}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByIdWithProfile(id: number) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          profile: true,
        },
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true,
          isEmailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user with profile by id: ${id}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findUserById(id: number) {
    try {
      return await db.query.users.findFirst({
        where: eq(users.id, id),
        columns: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          organizationId: true,
          isEmailVerified: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user with profile by id: ${id}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async createUser(userData: NewUser): Promise<number> {
    const [userId] = await db.insert(users).values(userData).$returningId();
    if (!userId || isNaN(userId.id)) {
      throw new DatabaseError(`Invalid insertId returned: ${userId?.id}`);
    }
    return userId.id;
  }

  async createWithProfile(
    userData: NewUser,
    profileData?: Partial<NewUserProfile>,
  ): Promise<number> {
    try {
      return await db.transaction(async (tx) => {
        const [res] = await tx.insert(users).values(userData).$returningId();

        if (!res) {
          throw new DatabaseError(
            `Failed to insert user with data: ${JSON.stringify(userData)}`,
          );
        }

        const userId = res.id;

        if (profileData) {
          await tx.insert(userProfile).values({
            ...profileData,
            userId,
          });
        }

        return userId;
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to create user with data: ${JSON.stringify(userData)}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async deleteUser(userId: number): Promise<void> {
    // Check if user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new DatabaseError(`User with ID ${userId} not found`);
    }

    await db.delete(users).where(eq(users.id, user.id));
  }

  async updateProfile(
    userId: number,
    profileData: Partial<NewUserProfile>,
  ): Promise<void> {
    try {
      const existingProfile = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.userId, userId));

      if (existingProfile.length > 0) {
        await db
          .update(userProfile)
          .set(profileData)
          .where(eq(userProfile.userId, userId));
      } else {
        await db.insert(userProfile).values({
          ...profileData,
          userId,
        });
      }
    } catch (error) {
      throw new DatabaseError(
        `Failed to update profile for userId: ${userId}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async searchUsers(
    searchTerm: string,
    role: "user" | "employer" | "admin" | undefined,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    items: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (searchTerm) {
        conditions.push(
          or(
            like(users.firstName, `%${searchTerm}%`),
            like(users.lastName, `%${searchTerm}%`),
            like(users.email, `%${searchTerm}%`),
          ),
        );
      }

      if (role) {
        conditions.push(eq(users.role, role));
      }

      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      const items = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          organizationId: users.organizationId,
          isEmailVerified: users.isEmailVerified,
          isActive: users.isActive,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereCondition)
        .limit(limit)
        .offset(offset);

      const totalResult = await db
        .select({ count: count() })
        .from(users)
        .where(whereCondition);

      const total = totalResult[0]?.count ?? 0;

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new DatabaseError(
        `Failed to search users with term: ${searchTerm}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByRole(role: "user" | "employer" | "admin"): Promise<User[]> {
    try {
      return await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          organizationId: users.organizationId,
          isEmailVerified: users.isEmailVerified,
          isActive: users.isActive,
          lastLoginAt: users.lastLoginAt,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.role, role));
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch users by role: ${role}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findActiveUsersByRole() {
    return db.query.users.findMany({
      with: {
        profile: true,
      },
      where: and(eq(users.isActive, true), eq(users.isActive, true)),
    });
  }
}
