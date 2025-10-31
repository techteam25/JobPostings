import { and, count, eq, like, or, sql, ne, desc } from "drizzle-orm";
import {
  certifications,
  educations,
  userCertifications,
  userProfile,
  user,
  workExperiences,
  savedJobs,
  jobsDetails,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { DatabaseError } from "@/utils/errors";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import {
  NewUserProfile,
  UpdateUserProfile,
  User,
} from "@/validations/userProfile.validation";

export class UserRepository extends BaseRepository<typeof user> {
  constructor() {
    super(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
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
          await db.query.user.findFirst({
            where: and(eq(user.id, id), eq(user.status, "active")),
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
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user with profile by id: ${id}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByIdWithPassword(id: number): Promise<User | undefined> {
    try {
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
    } catch (error) {
      throw new DatabaseError(
        `Failed to query user with password by id: ${id}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findUserById(id: number) {
    try {
      return await withDbErrorHandling(
        async () =>
          await db.query.user.findFirst({
            where: eq(user.id, id),
            columns: {
              id: true,
              email: true,
              fullName: true,
              emailVerified: true,
              status: true,
              deletedAt: true,
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

            return await tx.query.user.findFirst({
              where: eq(user.id, userId),
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
                fullName: true,
                emailVerified: true,
                image: true,
                status: true,
                deletedAt: true,
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
            like(user.fullName, `%${searchTerm}%`),
            like(user.email, `%${searchTerm}%`),
          ),
        );
      }

      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [items, totalResult] = await withDbErrorHandling(
        async () =>
          await db.transaction(async (tx) => {
            const items = await tx
              .select({
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                image: user.image,
                emailVerified: user.emailVerified,
                status: user.status,
                deletedAt: user.deletedAt,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
              })
              .from(user)
              .where(whereCondition)
              .limit(limit)
              .offset(offset);

            const [totalResult] = await tx
              .select({ count: count() })
              .from(user)
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
        `Failed to search user with term: ${searchTerm}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findActiveUsersIncludingProfile() {
    try {
      return await withDbErrorHandling(async () =>
        db.query.user.findMany({
          where: eq(user.status, "active"),
          with: {
            profile: {
              with: {
                certifications: { columns: {}, with: { certification: true } },
                education: true,
                workExperiences: true,
              },
            },
          },
        }),
      );
    } catch (error) {
      throw new DatabaseError(
        "Failed to find active user by role",
        error instanceof Error ? error : undefined,
      );
    }
  }

  async deactivateUserAccount(
    id: number,
    data: { status: "active" | "deactivated" | "deleted" },
  ) {
    try {
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
    } catch (error) {
      throw new DatabaseError(
        `Failed to deactivate user account for user with id: ${id}`,
        error,
      );
    }
  }

  // Check if user can act as jobseeker
  async canSeekJobs(userId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const profile = await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, userId),
      });
      return !!profile;
    });
  }

  async getSavedJobsForUser(userId: number, page: number, limit: number) {
    return withDbErrorHandling(async () => {
      const offset = Math.max(0, (page - 1) * limit);
      const userSavedJobs = await db.query.savedJobs.findMany({
        limit,
        offset,
        orderBy: [desc(savedJobs.savedAt)],
        where: eq(savedJobs.userId, userId),
        columns: {
          id: true,
          savedAt: true,
        },
        with: {
          job: {
            columns: {
              id: true,
              title: true,
              city: true,
              state: true,
              country: true,
              jobType: true,
              compensationType: true,
              isRemote: true,
              isActive: true,
              applicationDeadline: true,
            },
            with: {
              employer: {
                columns: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  url: true,
                },
              },
            },
          },
        },
      });

      const response = userSavedJobs.map((savedJob) => ({
        ...savedJob,
        isClosed: savedJob.job.applicationDeadline
          ? new Date(savedJob.job.applicationDeadline) < new Date()
          : false,
        isExpired: !savedJob.job.isActive,
      }));

      const totalPages = Math.ceil(response.length / limit);

      const hasNext = page < totalPages;
      const hasPrevious = page > 1;
      return {
        items: response,
        pagination: {
          page,
          limit,
          totalPages,
          hasNext,
          hasPrevious,
          nextPage: hasNext ? page + 1 : null,
          previousPage: hasPrevious ? page - 1 : null,
        },
      };
    });
  }

  async saveJobForUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      return await db.transaction(async (tx) => {
        const savedJobsTotal = await tx.$count(
          savedJobs,
          eq(savedJobs.userId, userId),
        );

        if (savedJobsTotal >= 50) {
          throw new DatabaseError(
            "Saved jobs limit reached. You can save up to 50 jobs.",
          );
        }

        const jobExists = await tx.query.jobsDetails.findFirst({
          where: eq(jobsDetails.id, jobId),
          columns: { id: true },
        });

        if (!jobExists) {
          throw new DatabaseError(`Job with id ${jobId} does not exist.`);
        }

        const [result] = await tx
          .insert(savedJobs)
          .values({
            userId,
            jobId,
            savedAt: sql`CURRENT_TIMESTAMP`,
          })
          .onDuplicateKeyUpdate({
            set: {
              savedAt: sql`CURRENT_TIMESTAMP`,
            },
          })
          .$returningId();

        if (!result || isNaN(result.id)) {
          throw new DatabaseError(`Invalid insertId returned: ${result?.id}`);
        }

        return { success: true };
      });
    });
  }

  async isJobSavedByUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      const savedJob = await db.query.savedJobs.findFirst({
        where: and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)),
        columns: {
          id: true,
        },
      });

      return !!savedJob;
    });
  }

  async unsaveJobForUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      const [deletedResult] = await db
        .delete(savedJobs)
        .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));

      if (!deletedResult || deletedResult.affectedRows === 0) {
        throw new DatabaseError("Failed to unsave job: record not found");
      }

      return { success: true };
    });
  }
}
