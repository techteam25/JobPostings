import { and, count, eq, like, or, sql } from "drizzle-orm";
import {
  certifications,
  educations,
  NewUser,
  NewUserProfile,
  UpdateUserProfile,
  User,
  userCertifications,
  userProfile,
  users,
  workExperiences,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { DatabaseError } from "@/utils/errors";
import { withDbErrorHandling } from "@/db/dbErrorHandler";

export class UserRepository extends BaseRepository<typeof users> {
  constructor() {
    super(users);
  }

async findByEmailWithPassword(email: string) {
    try {
      return await withDbErrorHandling(
        async () => {
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
          if (user && !user.isActive) {
            return undefined; // Treat deactivated users as non-existent for login
          }
          return user;
        }
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user by email: ${email}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.query.users.findFirst({
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
          }),
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user by email: ${email}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByIdWithProfile(id: number) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.query.users.findFirst({
            where: eq(users.id, id),
            with: {
              profile: {
                with: {
                  certifications: {
                    columns: {},
                    with: { certification: true },
                  },
                  education: true,
                  workExperiences: true,
                },
              },
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
          }),
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user with profile by id: ${id}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findUserById(id: number) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.query.users.findFirst({
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
          }),
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user with profile by id: ${id}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async createUser(userData: NewUser): Promise<number> {
    const [userId] = await withDbErrorHandling(
      async () => await db.insert(users).values(userData).$returningId(),
    );
    if (!userId || isNaN(userId.id)) {
      throw new DatabaseError(`Invalid insertId returned: ${userId?.id}`);
    }
    return userId.id;
  }

  async createProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.transaction(async (tx) => {
            const [result] = await tx
              .insert(userProfile)
              .values({
                ...profileData,
                userId,
              })
              .$returningId();

            if (!result || isNaN(result.id)) {
              throw new DatabaseError(
                `Invalid insertId returned: ${result?.id}`,
              );
            }

            return await tx.query.userProfile.findFirst({
              where: eq(userProfile.id, result.id),
              with: {
                certifications: {
                  columns: {},
                  with: { certification: true },
                },
                education: true,
                workExperiences: true,
              },
            });
          }),
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to create Profile with data`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async deleteUser(userId: number): Promise<void> {
    // Check if user exists
    await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const user = await tx.query.users.findFirst({
            where: eq(users.id, userId),
          });

          if (!user) {
            tx.rollback();
          }
          await tx.delete(userProfile).where(eq(userProfile.userId, userId));
          await tx.delete(users).where(eq(users.id, userId));
        }),
    );
  }

  async updateProfile(userId: number, profileData: UpdateUserProfile) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.transaction(async (tx) => {
            const {
              educations: educationsData,
              workExperiences: workExperiencesData,
              certifications: certificationsData,
              ...userProfileData
            } = profileData;

            console.log({ workExperiencesData, certificationsData });

            await tx.update(userProfile).set({ ...userProfileData, userId });
            const userProfileId = await tx
              .select({ id: userProfile.id })
              .from(userProfile)
              .where(eq(userProfile.userId, userId))
              .then((rows) => (rows[0] ? rows[0].id : null));

            if (!userProfileId) {
              throw new DatabaseError(
                `User profile not found for userId: ${userId}`,
              );
            }

            // Upsert Educations
            if (educationsData && educationsData.length > 0) {
              const edu = educationsData.map((e) => ({
                ...e,
                userProfileId,
                startDate: new Date(e.startDate),
                endDate: e.endDate ? new Date(e.endDate) : null,
              }));

              await tx
                .insert(educations)
                .values(edu)
                .onDuplicateKeyUpdate({
                  set: {
                    userProfileId,
                    schoolName: sql`values(${educations.schoolName})`,
                    program: sql`values(${educations.program})`,
                    major: sql`values(${educations.major})`,
                    graduated: sql`values(${educations.graduated})`,
                    startDate: sql`values(${educations.startDate})`,
                    endDate: sql`values(${educations.endDate})`,
                  },
                });
            }

            // Upsert Work Experiences
            if (workExperiencesData && workExperiencesData.length > 0) {
              const work = workExperiencesData.map((we) => ({
                ...we,
                userProfileId,
                startDate: new Date(we.startDate),
                endDate: we.endDate ? new Date(we.endDate) : null,
              }));

              await tx
                .insert(workExperiences)
                .values(work)
                .onDuplicateKeyUpdate({
                  set: {
                    userProfileId,
                    companyName: sql`values(${workExperiences.companyName})`,
                    current: sql`values(${workExperiences.current})`,
                    startDate: sql`values(${workExperiences.startDate})`,
                    endDate: sql`values(${workExperiences.endDate})`,
                  },
                });
            }

            // Upsert Certifications
            if (certificationsData && certificationsData.length > 0) {
              const [record] = await tx
                .insert(certifications)
                .values(certificationsData)
                .onDuplicateKeyUpdate({
                  set: {
                    certificationName: sql`values(${certifications.certificationName})`,
                  },
                })
                .$returningId();

              // Link Certification to User Profile in Junction Table
              if (record && record.id) {
                await tx
                  .insert(userCertifications)
                  .values({
                    certificationId: record.id,
                    userId: userProfileId,
                  })
                  .onDuplicateKeyUpdate({
                    set: {
                      certificationId: sql`values(${userCertifications.certificationId})`,
                    },
                  });
              }
            }

            return await tx.query.users.findFirst({
              where: eq(users.id, userId),
              with: {
                profile: {
                  with: {
                    certifications: {
                      columns: {},
                      with: { certification: true },
                    },
                    education: true,
                    workExperiences: true,
                  },
                },
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
          }),
      );
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

      const [items, totalResult] = await withDbErrorHandling(
        async () =>
          await db.transaction(async (tx) => {
            const items = await tx
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

            const [totalResult] = await tx
              .select({ count: count() })
              .from(users)
              .where(whereCondition);

            return [items, totalResult];
          }),
      );

      const total = totalResult?.count ?? 0;

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
      return await withDbErrorHandling(
        async () =>
          await db
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
            .where(eq(users.role, role)),
      );
    } catch (error) {
      throw new DatabaseError(
        `Failed to fetch users by role: ${role}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findActiveUsersByRole() {
    return withDbErrorHandling(async () =>
      db.query.users.findMany({
        with: {
          profile: true,
        },
        where: and(eq(users.isActive, true), eq(users.isActive, true)),
      }),
    );
  }
}
