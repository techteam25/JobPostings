import { and, count, desc, eq, like, ne, or, sql } from "drizzle-orm";
import {
  certifications,
  educations,
  jobsDetails,
  savedJobs,
  user,
  userCertifications,
  userOnBoarding,
  userProfile,
  workExperiences,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { DatabaseError, NotFoundError } from "@/utils/errors";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import {
  NewUserProfile,
  UpdateUserProfile,
  User,
} from "@/validations/userProfile.validation";

/**
 * Repository class for managing user-related database operations, including profiles and saved jobs.
 */
export class UserRepository extends BaseRepository<typeof user> {
  /**
   * Creates an instance of UserRepository.
   */
  constructor() {
    super(user);
  }

  /**
   * Finds a user by their email address, excluding deleted users.
   * @param email The email address to search for.
   * @returns The user data or undefined if not found.
   */
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

  /**
   * Finds a user by their ID, including profile information with related data.
   * @param id The ID of the user.
   * @returns The user with profile, certifications, education, and work experiences.
   */
  async findByIdWithProfile(id: number) {
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
  }

  /**
   * Retrieves the profile completion status for a user.
   * @param userId The ID of the user.
   * @returns An object indicating if the profile is complete and what components are present.
   */
  async getUserProfileStatus(userId: number) {
    const result = await withDbErrorHandling(
      async () =>
        await db.query.userProfile.findFirst({
          where: eq(userProfile.userId, userId),
          columns: {
            id: true,
            resumeUrl: true,
            bio: true,
          },
          with: {
            certifications: {
              columns: {},
              with: { certification: true },
            },
            education: true,
            workExperiences: true,
          },
        }),
    );

    if (!result) {
      return { complete: false };
    }

    const hasCertifications = result.certifications.length > 0;
    const hasEducation = result.education.length > 0;
    const hasWorkExperiences = result.workExperiences.length > 0;
    const hasResume = !!result.resumeUrl;
    const hasBio = !!result.bio;

    const complete =
      hasCertifications &&
      hasEducation &&
      hasWorkExperiences &&
      hasResume &&
      hasBio;

    return { complete };
  }

  /**
   * Finds a user by their ID, including password information.
   * @param id The ID of the user.
   * @returns The user data with password or undefined if not found.
   */
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

  /**
   * Finds a user by their ID without profile information.
   * @param id The ID of the user.
   * @returns The user data.
   */
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
            status: true,
            deletedAt: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
    );
  }

  /**
   * Creates a user profile for an existing user.
   * @param userId The ID of the user.
   * @param profileData The profile data to create.
   * @returns The created user profile with related data.
   */
  async createProfile(
    userId: number,
    profileData: Omit<NewUserProfile, "userId">,
  ) {
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
            throw new DatabaseError(`Invalid insertId returned: ${result?.id}`);
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
  }

  /**
   * Updates a user's profile, including education, work experiences, and certifications.
   * @param userId The ID of the user.
   * @param profileData The profile data to update.
   * @returns The updated user with profile information.
   */
  async updateProfile(userId: number, profileData: UpdateUserProfile) {
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
  }

  /**
   * Searches users by name or email with pagination.
   * @param searchTerm The term to search for.
   * @param options Pagination options including page and limit.
   * @returns An object containing the users and pagination metadata.
   */
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
    const { page = 1, limit = 10 } = options;
    const offset = Math.max(0, (page - 1) * limit);

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
  }

  /**
   * Finds all active users including their profiles.
   * @returns An array of active users with profile information.
   */
  async findActiveUsersIncludingProfile() {
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
  }

  /**
   * Deactivates or activates a user account.
   * @param id The ID of the user.
   * @param data The status update data.
   * @returns The updated user data.
   */
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

  /**
   * Checks if a user can seek jobs by verifying if they have a profile.
   * @param userId The ID of the user.
   * @returns True if the user has a profile, false otherwise.
   */
  async canSeekJobs(userId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const profile = await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, userId),
      });
      return !!profile;
    });
  }

  /**
   * Retrieves saved jobs for a user with pagination.
   * @param userId The ID of the user.
   * @param page The page number for pagination.
   * @param limit The number of jobs per page.
   * @returns An object containing the saved jobs and pagination metadata.
   */
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
          total: response.length,
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

  /**
   * Saves a job for a user, with a limit of 50 saved jobs.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to save.
   * @returns An object indicating success.
   */
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
          throw new NotFoundError("Job", jobId);
        }

        const [result] = await tx
          .insert(savedJobs)
          .values({
            userId,
            jobId,
            savedAt: sql.raw("CURRENT_TIMESTAMP"),
          })
          .onDuplicateKeyUpdate({
            set: {
              savedAt: sql.raw("CURRENT_TIMESTAMP"),
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

  /**
   * Checks if a job is saved by a user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job.
   * @returns True if the job is saved, false otherwise.
   */
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

  /**
   * Unsaves a job for a user.
   * @param userId The ID of the user.
   * @param jobId The ID of the job to unsave.
   * @returns An object indicating success.
   */
  async unsaveJobForUser(userId: number, jobId: number) {
    return withDbErrorHandling(async () => {
      const savedJob = await db.query.savedJobs.findFirst({
        where: and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)),
        columns: {
          id: true,
        },
      });

      if (!savedJob) {
        throw new NotFoundError("Job", jobId);
      }

      const [deletedResult] = await db
        .delete(savedJobs)
        .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)));

      if (!deletedResult || deletedResult.affectedRows === 0) {
        throw new DatabaseError("Failed to unsave job: record not found");
      }

      return { success: true };
    });
  }

  /**
   * Retrieves the onboarding intent for a user.
   * @param userId The ID of the user.
   * @returns The user's onboarding intent and status.
   */
  async getUserIntent(userId: number) {
    return await withDbErrorHandling(async () => {
      return await db.query.userOnBoarding.findFirst({
        where: eq(userOnBoarding.userId, userId),
        columns: {
          intent: true,
          status: true,
        },
      });
    });
  }
}
