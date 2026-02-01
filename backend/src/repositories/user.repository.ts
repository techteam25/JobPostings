import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNull,
  like,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import {
  certifications,
  educations,
  emailPreferenceAuditLog,
  jobAlertMatches,
  jobAlerts,
  jobsDetails,
  savedJobs,
  user,
  userCertifications,
  userEmailPreferences,
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
import { InsertJobAlert, JobAlert } from "@/validations/jobAlerts.validation";

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

  /**
   * Updates the profile visibility for a user.
   * @param userId The ID of the user.
   * @param isPublic Boolean indicating if the profile should be public.
   * @returns The updated user profile.
   */
  async updateProfileVisibility(userId: number, isPublic: boolean) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userProfile)
        .set({ isProfilePublic: isPublic })
        .where(eq(userProfile.userId, userId));

      if (!result.affectedRows && result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update profile visibility for userId: ${userId}`,
        );
      }

      return await db.query.userProfile.findFirst({
        where: eq(userProfile.userId, userId),
      });
    });
  }

  /**
   * Finds email preferences by user ID.
   * @param userId The ID of the user.
   * @returns The user's email preferences or undefined if not found.
   */
  async findEmailPreferencesByUserId(userId: number) {
    return await withDbErrorHandling(
      async () =>
        await db.query.userEmailPreferences.findFirst({
          where: eq(userEmailPreferences.userId, userId),
        }),
    );
  }

  /**
   * Finds email preferences by unsubscribe token.
   * @param token The unsubscribe token.
   * @returns The user's email preferences or undefined if not found.
   */
  async findEmailPreferencesByToken(token: string) {
    return await withDbErrorHandling(
      async () =>
        await db.query.userEmailPreferences.findFirst({
          where: eq(userEmailPreferences.unsubscribeToken, token),
        }),
    );
  }

  /**
   * Creates default email preferences for a user.
   * @param userId The ID of the user.
   * @param unsubscribeToken The generated unsubscribe token.
   * @returns The created email preferences.
   */
  async createEmailPreferences(userId: number, unsubscribeToken: string) {
    return await withDbErrorHandling(async () => {
      const tokenExpiresAt = new Date();

      // Set token to expire in 30 days
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

      const [result] = await db
        .insert(userEmailPreferences)
        .values({
          userId,
          unsubscribeToken,
          unsubscribeTokenExpiresAt: tokenExpiresAt,
          jobMatchNotifications: true,
          applicationStatusNotifications: true,
          savedJobUpdates: true,
          weeklyJobDigest: true,
          monthlyNewsletter: true,
          marketingEmails: true,
          accountSecurityAlerts: true,
          globalUnsubscribe: false,
        })
        .$returningId();

      if (!result || isNaN(result.id)) {
        throw new DatabaseError(
          `Failed to create email preferences for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  /**
   * Updates email preferences for a user.
   * @param userId The ID of the user.
   * @param preferences Partial email preferences to update.
   * @returns The updated email preferences.
   */
  async updateEmailPreferences(
    userId: number,
    preferences: Partial<{
      jobMatchNotifications: boolean;
      applicationStatusNotifications: boolean;
      savedJobUpdates: boolean;
      weeklyJobDigest: boolean;
      monthlyNewsletter: boolean;
      marketingEmails: boolean;
      globalUnsubscribe: boolean;
    }>,
  ) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userEmailPreferences)
        .set(preferences)
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update email preferences for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  /**
   * Generates and updates a new unsubscribe token for a user.
   * @param userId The ID of the user.
   * @param newToken The new unsubscribe token.
   * @returns The updated email preferences.
   */
  async refreshUnsubscribeToken(userId: number, newToken: string) {
    return await withDbErrorHandling(async () => {
      const tokenExpiresAt = new Date();

      // Set token to expire in 30 days
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30);

      const [result] = await db
        .update(userEmailPreferences)
        .set({
          unsubscribeToken: newToken,
          tokenCreatedAt: new Date(),
          unsubscribeTokenExpiresAt: tokenExpiresAt,
        })
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to refresh unsubscribe token for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  /**
   * Checks if a user can receive a specific type of email based on preferences.
   * @param userId The ID of the user.
   * @param emailType The type of email to check (e.g., 'jobMatchNotifications').
   * @returns True if the user can receive the email, false otherwise.
   */
  async canSendEmailType(
    userId: number,
    emailType:
      | "jobMatchNotifications"
      | "applicationStatusNotifications"
      | "savedJobUpdates"
      | "weeklyJobDigest"
      | "monthlyNewsletter"
      | "marketingEmails"
      | "accountSecurityAlerts",
  ): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const preferences = await db.query.userEmailPreferences.findFirst({
        where: eq(userEmailPreferences.userId, userId),
      });

      if (!preferences) {
        return true;
      }

      if (preferences.globalUnsubscribe) {
        return emailType === "accountSecurityAlerts";
      }

      return preferences[emailType] === true;
    });
  }

  /**
   * Checks if a user can create more job alerts.
   * @param userId The ID of the user.
   * @returns Object with canCreate flag, current count, and max allowed.
   */
  async canCreateJobAlert(userId: number): Promise<{
    canCreate: boolean;
    currentCount: number;
    maxAllowed: number;
  }> {
    return await withDbErrorHandling(async () => {
      const result = await db
        .select({ count: count() })
        .from(jobAlerts)
        .where(and(eq(jobAlerts.userId, userId), eq(jobAlerts.isActive, true)));

      const currentCount = result[0]?.count ?? 0;
      const MAX_ALERTS_PER_USER = 10;

      return {
        canCreate: currentCount < MAX_ALERTS_PER_USER,
        currentCount,
        maxAllowed: MAX_ALERTS_PER_USER,
      };
    });
  }

  /**
   * Creates a new job alert for a user.
   * @param userId The ID of the user.
   * @param alertData The job alert data.
   * @returns The created job alert.
   */
  async createJobAlert(
    userId: number,
    alertData: Omit<InsertJobAlert, "userId">,
  ): Promise<JobAlert> {
    return await withDbErrorHandling(async () => {
      const [alert] = await db
        .insert(jobAlerts)
        .values({
          ...alertData,
          userId,
        })
        .$returningId();

      if (!alert || isNaN(alert.id)) {
        throw new DatabaseError(`Invalid insertId returned: ${alert?.id}`);
      }

      // Fetch the created alert with all fields
      const createdAlert = await db.query.jobAlerts.findFirst({
        where: eq(jobAlerts.id, alert.id),
      });

      if (!createdAlert) {
        throw new DatabaseError("Failed to retrieve created job alert");
      }

      return createdAlert;
    });
  }

  /**
   * Retrieves all job alerts for a user with pagination.
   * @param userId The ID of the user.
   * @param pagination Pagination parameters.
   * @returns Paginated job alerts with metadata.
   */
  async getUserJobAlerts(
    userId: number,
    pagination: { page: number; limit: number },
  ) {
    return await withDbErrorHandling(async () => {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await db
        .select({ total: count() })
        .from(jobAlerts)
        .where(eq(jobAlerts.userId, userId));

      const total = countResult[0]?.total ?? 0;

      // Get paginated alerts
      const alerts = await db.query.jobAlerts.findMany({
        where: eq(jobAlerts.userId, userId),
        limit,
        offset,
        orderBy: [desc(jobAlerts.createdAt)],
      });

      const totalPages = Math.ceil(total / limit);

      return {
        items: alerts,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    });
  }

  /**
   * Retrieves a specific job alert by ID for a user.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert.
   * @returns The job alert or undefined if not found.
   */
  async getJobAlertById(
    userId: number,
    alertId: number,
  ): Promise<JobAlert | undefined> {
    return await withDbErrorHandling(async () => {
      return await db.query.jobAlerts.findFirst({
        where: and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)),
      });
    });
  }

  /**
   * Updates a job alert for a user.
   * Only updates provided fields.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert.
   * @param updateData Partial job alert data to update.
   * @returns The updated job alert or undefined if not found.
   */
  async updateJobAlert(
    userId: number,
    alertId: number,
    updateData: Partial<Omit<InsertJobAlert, "userId" | "id">>,
  ): Promise<JobAlert | undefined> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(jobAlerts)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update job alert with id: ${alertId}`,
        );
      }

      return await db.query.jobAlerts.findFirst({
        where: and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)),
      });
    });
  }

  /**
   * Deletes a job alert for a user.
   * Cascade delete will handle related job_alert_matches records.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert.
   */
  async deleteJobAlert(userId: number, alertId: number): Promise<void> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(jobAlerts)
        .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to delete job alert with id: ${alertId}`,
        );
      }
    });
  }

  /**
   * Updates the pause state of a job alert.
   * @param userId The ID of the user.
   * @param alertId The ID of the alert.
   * @param isPaused The new pause state.
   * @returns The updated job alert or undefined if not found.
   */
  async updateJobAlertPauseState(
    userId: number,
    alertId: number,
    isPaused: boolean,
  ): Promise<JobAlert | undefined> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(jobAlerts)
        .set({
          isPaused,
          updatedAt: new Date(),
        })
        .where(and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update pause state for job alert with id: ${alertId}`,
        );
      }

      return await db.query.jobAlerts.findFirst({
        where: and(eq(jobAlerts.id, alertId), eq(jobAlerts.userId, userId)),
      });
    });
  }

  /**
   * Retrieves active job alerts that are due for processing based on frequency.
   * @param frequency The frequency type ('daily' or 'weekly').
   * @param cutoffTime The cutoff timestamp - alerts with lastSentAt before this time will be processed.
   * @returns Array of job alerts ready for processing.
   */
  async getAlertsForProcessing(
    frequency: "daily" | "weekly",
    cutoffTime: Date,
  ): Promise<JobAlert[]> {
    return await withDbErrorHandling(async () => {
      return await db.query.jobAlerts.findMany({
        where: and(
          eq(jobAlerts.isActive, true),
          eq(jobAlerts.isPaused, false),
          eq(jobAlerts.frequency, frequency),
          or(
            isNull(jobAlerts.lastSentAt),
            lte(jobAlerts.lastSentAt, cutoffTime),
          ),
        ),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: [asc(jobAlerts.lastSentAt)],
      });
    });
  }

  /**
   * Updates the lastSentAt timestamp for a job alert.
   * @param alertId The ID of the alert to update.
   * @param timestamp The timestamp to set.
   */
  async updateAlertLastSentAt(alertId: number, timestamp: Date): Promise<void> {
    await withDbErrorHandling(async () => {
      await db
        .update(jobAlerts)
        .set({ lastSentAt: timestamp })
        .where(eq(jobAlerts.id, alertId));
    });
  }

  /**
   * Saves job matches for a job alert.
   * @param matches Array of match records to insert.
   */
  async saveAlertMatches(
    matches: Array<{
      jobAlertId: number;
      jobId: number;
      matchScore: number;
    }>,
  ): Promise<void> {
    if (matches.length === 0) return;

    await withDbErrorHandling(async () => {
      await db.insert(jobAlertMatches).values(
        matches.map((match) => ({
          ...match,
          wasSent: false,
        })),
      );
    });
  }

  /**
   * Retrieves unsent matches for a job alert.
   * @param alertId The ID of the job alert.
   * @param limit Maximum number of matches to retrieve.
   * @returns Array of job alert matches with job details.
   */
  async getUnsentMatches(alertId: number, limit: number = 10) {
    return await withDbErrorHandling(async () => {
      return await db.query.jobAlertMatches.findMany({
        where: and(
          eq(jobAlertMatches.jobAlertId, alertId),
          eq(jobAlertMatches.wasSent, false),
        ),
        with: {
          job: {
            columns: {
              id: true,
              title: true,
              city: true,
              state: true,
              country: true,
              jobType: true,
              experience: true,
              description: true,
              createdAt: true,
            },
            with: {
              employer: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          desc(jobAlertMatches.matchScore),
          desc(jobAlertMatches.createdAt),
        ],
        limit,
      });
    });
  }

  /**
   * Marks job alert matches as sent.
   * @param matchIds Array of match IDs to mark as sent.
   */
  async markMatchesAsSent(matchIds: number[]): Promise<void> {
    if (matchIds.length === 0) return;

    await withDbErrorHandling(async () => {
      await db
        .update(jobAlertMatches)
        .set({ wasSent: true })
        .where(inArray(jobAlertMatches.id, matchIds));
    });
  }

  /**
   * Gets the count of unsent matches for a job alert.
   * @param alertId The ID of the job alert.
   * @returns The count of unsent matches.
   */
  async getUnsentMatchCount(alertId: number): Promise<number> {
    return await withDbErrorHandling(async () => {
      const result = await db
        .select({ count: count() })
        .from(jobAlertMatches)
        .where(
          and(
            eq(jobAlertMatches.jobAlertId, alertId),
            eq(jobAlertMatches.wasSent, false),
          ),
        );
      return result[0]?.count ?? 0;
    });
  }

  /**
   * Pauses job alerts for inactive users (users with status "deactivated").
   * @returns Object containing counts of affected alerts and users.
   */
  async pauseAlertsForInactiveUsers(): Promise<{
    alertsPaused: number;
    usersAffected: number;
  }> {
    return await withDbErrorHandling(async () => {
      // Find deactivated users with active, unpaused alerts
      const inactiveUsersWithAlerts = await db
        .select({
          userId: user.id,
          userEmail: user.email,
          status: user.status,
        })
        .from(user)
        .innerJoin(jobAlerts, eq(user.id, jobAlerts.userId))
        .where(
          and(
            // User status is deactivated (inactive)
            eq(user.status, "deactivated"),
            // Alert is active and not already paused
            eq(jobAlerts.isActive, true),
            eq(jobAlerts.isPaused, false),
          ),
        )
        .groupBy(user.id, user.email, user.status);

      if (inactiveUsersWithAlerts.length === 0) {
        return { alertsPaused: 0, usersAffected: 0 };
      }

      const inactiveUserIds = inactiveUsersWithAlerts.map((u) => u.userId);

      // Pause all active alerts for these inactive users
      await db
        .update(jobAlerts)
        .set({
          isPaused: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(jobAlerts.userId, inactiveUserIds),
            eq(jobAlerts.isActive, true),
            eq(jobAlerts.isPaused, false),
          ),
        );

      // Count how many alerts were actually paused
      const alertsPausedResult = await db
        .select({ count: count() })
        .from(jobAlerts)
        .where(
          and(
            inArray(jobAlerts.userId, inactiveUserIds),
            eq(jobAlerts.isPaused, true),
          ),
        );

      const alertsPaused = alertsPausedResult[0]?.count ?? 0;

      return {
        alertsPaused,
        usersAffected: inactiveUsersWithAlerts.length,
      };
    });
  }

  /**
   * Logs an email preference change to the audit log.
   * @param data The audit log data.
   * @returns The created audit log ID.
   */
  async logPreferenceChange(data: {
    userId: number;
    preferenceType: string;
    context: "job_seeker" | "employer" | "global";
    previousValue: boolean | null;
    newValue: boolean;
    changeSource: "account_settings" | "email_link";
    ipAddress?: string;
    userAgent?: string;
  }) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .insert(emailPreferenceAuditLog)
        .values(data)
        .$returningId();

      if (!result || isNaN(result.id)) {
        throw new DatabaseError("Failed to log preference change");
      }

      return result.id;
    });
  }

  /**
   * Gets audit history for a user's email preferences.
   * @param userId The ID of the user.
   * @param limit Maximum number of records to return.
   * @returns Array of audit log entries.
   */
  async getUserAuditHistory(userId: number, limit = 50) {
    return await withDbErrorHandling(async () => {
      return await db.query.emailPreferenceAuditLog.findMany({
        where: eq(emailPreferenceAuditLog.userId, userId),
        orderBy: desc(emailPreferenceAuditLog.changedAt),
        limit,
      });
    });
  }

  /**
   * Set default employer email preferences when user joins organization.
   * @param userId The ID of the user.
   * @returns The updated email preferences.
   */
  async setEmployerEmailPreferences(userId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userEmailPreferences)
        .set({ matchedCandidates: true })
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows) {
        throw new DatabaseError(
          `Failed to set employer preferences for userId: ${userId}`,
        );
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  /**
   * Unsubscribe from specific context (job_seeker/employer/global).
   * @param userId The ID of the user.
   * @param context The context to unsubscribe from.
   * @returns The updated email preferences.
   */
  async unsubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ) {
    return await withDbErrorHandling(async () => {
      const updateData: any = {};

      if (context === "global") {
        updateData.globalUnsubscribe = true;
      } else if (context === "job_seeker") {
        updateData.jobSeekerUnsubscribed = true;
        updateData.jobMatchNotifications = false;
        updateData.applicationStatusNotifications = false;
        updateData.savedJobUpdates = false;
        updateData.weeklyJobDigest = false;
      } else if (context === "employer") {
        updateData.employerUnsubscribed = true;
        updateData.matchedCandidates = false;
      }

      const [result] = await db
        .update(userEmailPreferences)
        .set(updateData)
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows) {
        throw new DatabaseError(`Failed to unsubscribe for userId: ${userId}`);
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }

  /**
   * Re-subscribe to specific context (job_seeker/employer/global).
   * @param userId The ID of the user.
   * @param context The context to re-subscribe to.
   * @returns The updated email preferences.
   */
  async resubscribeByContext(
    userId: number,
    context: "job_seeker" | "employer" | "global",
  ) {
    return await withDbErrorHandling(async () => {
      const updateData: any = {};

      if (context === "global") {
        updateData.globalUnsubscribe = false;
      } else if (context === "job_seeker") {
        updateData.jobSeekerUnsubscribed = false;
        updateData.jobMatchNotifications = true;
        updateData.applicationStatusNotifications = true;
        updateData.savedJobUpdates = true;
        updateData.weeklyJobDigest = true;
      } else if (context === "employer") {
        updateData.employerUnsubscribed = false;
        updateData.matchedCandidates = true;
      }

      const [result] = await db
        .update(userEmailPreferences)
        .set(updateData)
        .where(eq(userEmailPreferences.userId, userId));

      if (!result.affectedRows) {
        throw new DatabaseError(`Failed to resubscribe for userId: ${userId}`);
      }

      return await this.findEmailPreferencesByUserId(userId);
    });
  }
}
