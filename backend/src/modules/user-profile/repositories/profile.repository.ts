import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import {
  certifications,
  educations,
  jobsDetails,
  savedJobs,
  skills,
  user,
  userCertifications,
  userOnBoarding,
  userProfile,
  userSkills,
  workExperiences,
} from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import { db } from "@shared/db/connection";
import { DatabaseError, NotFoundError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { SecurityUtils } from "@shared/utils/security";
import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
} from "@/validations/userProfile.validation";
import type { InsertEducation } from "@/validations/educations.validation";
import type { InsertWorkExperience } from "@/validations/workExperiences.validation";
import type { NewCertification } from "@/validations/certifications.validation";
import type { NewSkill } from "@/validations/skills.validation";

/** Transaction type extracted from Drizzle's `db.transaction` callback */
type DbTransaction = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

export class ProfileRepository
  extends BaseRepository<typeof user>
  implements ProfileRepositoryPort
{
  constructor() {
    super(user);
  }

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
                skills: {
                  with: { skill: true },
                },
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
              isProfilePublic: profileData?.isProfilePublic ?? true,
              isAvailableForWork: profileData?.isAvailableForWork ?? true,
              userId,
            })
            .$returningId();

          if (!result || isNaN(result.id)) {
            throw new DatabaseError(`Invalid insertId returned: ${result?.id}`);
          }

          return tx.query.userProfile.findFirst({
            where: eq(userProfile.id, result.id),
            with: {
              certifications: {
                columns: {},
                with: { certification: true },
              },
              education: true,
              workExperiences: true,
              skills: {
                with: { skill: true },
              },
            },
          });
        }),
    );
  }

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

          await tx
            .update(userProfile)
            .set({ ...userProfileData, userId })
            .where(eq(userProfile.userId, userId));

          const profileId = await this.getProfileId(tx, userId);

          await this.upsertEducations(tx, profileId, educationsData);
          await this.upsertWorkExperiences(tx, profileId, workExperiencesData);
          await this.upsertCertifications(tx, profileId, certificationsData);

          return await this.fetchFullUserProfile(tx, userId);
        }),
    );
  }

  // ─── Private composable methods ──────────────────────────────────────

  private async getProfileId(
    tx: DbTransaction,
    userId: number,
  ): Promise<number> {
    const rows = await tx
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(eq(userProfile.userId, userId));

    if (!rows[0]) {
      throw new DatabaseError(`User profile not found for userId: ${userId}`);
    }

    return rows[0].id;
  }

  private async upsertEducations(
    tx: DbTransaction,
    userProfileId: number,
    educationsData: UpdateUserProfile["educations"],
  ): Promise<void> {
    if (!educationsData?.length) return;

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

  private async upsertWorkExperiences(
    tx: DbTransaction,
    userProfileId: number,
    workExperiencesData: UpdateUserProfile["workExperiences"],
  ): Promise<void> {
    if (!workExperiencesData?.length) return;

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
          jobTitle: sql`values(${workExperiences.jobTitle})`,
          description: sql`values(${workExperiences.description})`,
          current: sql`values(${workExperiences.current})`,
          startDate: sql`values(${workExperiences.startDate})`,
          endDate: sql`values(${workExperiences.endDate})`,
        },
      });
  }

  private async upsertCertifications(
    tx: DbTransaction,
    userProfileId: number,
    certificationsData: UpdateUserProfile["certifications"],
  ): Promise<void> {
    if (!certificationsData?.length) return;

    const [record] = await tx
      .insert(certifications)
      .values(certificationsData)
      .onDuplicateKeyUpdate({
        set: {
          certificationName: sql`values(${certifications.certificationName})`,
        },
      })
      .$returningId();

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

  private async fetchFullUserProfile(tx: DbTransaction, userId: number) {
    return tx.query.user.findFirst({
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
            skills: {
              with: { skill: true },
            },
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
  }

  async addEducation(
    userProfileId: number,
    data: Omit<InsertEducation, "userProfileId">,
  ) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .insert(educations)
        .values({
          ...data,
          userProfileId,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
        })
        .$returningId();

      if (!result || isNaN(result.id)) {
        throw new DatabaseError("Failed to add education");
      }

      const row = await db.query.educations.findFirst({
        where: eq(educations.id, result.id),
      });

      if (!row) {
        throw new DatabaseError("Failed to retrieve created education");
      }

      return row;
    });
  }

  async batchAddEducations(
    userProfileId: number,
    data: Omit<InsertEducation, "userProfileId">[],
  ) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const mapped = data.map((entry) => ({
            ...entry,
            userProfileId,
            startDate: new Date(entry.startDate),
            endDate: entry.endDate ? new Date(entry.endDate) : null,
          }));

          const insertedIds = await tx
            .insert(educations)
            .values(mapped)
            .$returningId();

          if (!insertedIds.length) {
            throw new DatabaseError("Failed to add education entries");
          }

          const ids = insertedIds.map((r) => r.id);

          return tx.query.educations.findMany({
            where: inArray(educations.id, ids),
          });
        }),
    );
  }

  async updateEducation(
    educationId: number,
    data: Partial<Omit<InsertEducation, "userProfileId">>,
  ) {
    return await withDbErrorHandling(async () => {
      const updateSet: Record<string, unknown> = { ...data };
      if (data.startDate) updateSet.startDate = new Date(data.startDate);
      if (data.endDate) updateSet.endDate = new Date(data.endDate);

      const [result] = await db
        .update(educations)
        .set(updateSet)
        .where(eq(educations.id, educationId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Education", educationId);
      }

      return true;
    });
  }

  async deleteEducation(educationId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(educations)
        .where(eq(educations.id, educationId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Education", educationId);
      }

      return true;
    });
  }

  async addWorkExperience(
    userProfileId: number,
    data: Omit<InsertWorkExperience, "userProfileId">,
  ) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .insert(workExperiences)
        .values({
          ...data,
          userProfileId,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
        })
        .$returningId();

      if (!result || isNaN(result.id)) {
        throw new DatabaseError("Failed to add work experience");
      }

      const row = await db.query.workExperiences.findFirst({
        where: eq(workExperiences.id, result.id),
      });

      if (!row) {
        throw new DatabaseError("Failed to retrieve created work experience");
      }

      return row;
    });
  }

  async batchAddWorkExperiences(
    userProfileId: number,
    data: Omit<InsertWorkExperience, "userProfileId">[],
  ) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const mapped = data.map((entry) => ({
            ...entry,
            userProfileId,
            startDate: new Date(entry.startDate),
            endDate: entry.endDate ? new Date(entry.endDate) : null,
          }));

          const insertedIds = await tx
            .insert(workExperiences)
            .values(mapped)
            .$returningId();

          if (!insertedIds.length) {
            throw new DatabaseError("Failed to add work experience entries");
          }

          const ids = insertedIds.map((r) => r.id);

          return tx.query.workExperiences.findMany({
            where: inArray(workExperiences.id, ids),
          });
        }),
    );
  }

  async updateWorkExperience(
    workExperienceId: number,
    data: Partial<Omit<InsertWorkExperience, "userProfileId">>,
  ) {
    return await withDbErrorHandling(async () => {
      const updateSet: Record<string, unknown> = { ...data };
      if (data.startDate) updateSet.startDate = new Date(data.startDate);
      if (data.endDate) updateSet.endDate = new Date(data.endDate);

      const [result] = await db
        .update(workExperiences)
        .set(updateSet)
        .where(eq(workExperiences.id, workExperienceId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("WorkExperience", workExperienceId);
      }

      return true;
    });
  }

  async deleteWorkExperience(workExperienceId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(workExperiences)
        .where(eq(workExperiences.id, workExperienceId));

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("WorkExperience", workExperienceId);
      }

      return true;
    });
  }

  async linkCertification(
    userProfileId: number,
    certificationData: NewCertification,
  ) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          const [record] = await tx
            .insert(certifications)
            .values(certificationData)
            .onDuplicateKeyUpdate({
              set: {
                certificationName: sql`values(${certifications.certificationName})`,
              },
            })
            .$returningId();

          if (!record || isNaN(record.id)) {
            throw new DatabaseError("Failed to create certification");
          }

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

          const row = await tx.query.certifications.findFirst({
            where: eq(certifications.id, record.id),
          });

          if (!row) {
            throw new DatabaseError("Failed to retrieve linked certification");
          }

          return row;
        }),
    );
  }

  async unlinkCertification(userProfileId: number, certificationId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(userCertifications)
        .where(
          and(
            eq(userCertifications.userId, userProfileId),
            eq(userCertifications.certificationId, certificationId),
          ),
        );

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Certification", certificationId);
      }

      return true;
    });
  }

  async linkSkill(userProfileId: number, skillData: NewSkill) {
    return await withDbErrorHandling(
      async () =>
        await db.transaction(async (tx) => {
          await tx
            .insert(skills)
            .values(skillData)
            .onDuplicateKeyUpdate({
              set: {
                name: sql`values(${skills.name})`,
              },
            });

          const skill = await tx.query.skills.findFirst({
            where: eq(skills.name, skillData.name),
          });

          if (!skill) {
            throw new DatabaseError("Failed to create skill");
          }

          await tx
            .insert(userSkills)
            .values({
              skillId: skill.id,
              userProfileId,
            })
            .onDuplicateKeyUpdate({
              set: {
                skillId: sql`values(${userSkills.skillId})`,
              },
            });

          return skill;
        }),
    );
  }

  async unlinkSkill(userProfileId: number, skillId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .delete(userSkills)
        .where(
          and(
            eq(userSkills.userProfileId, userProfileId),
            eq(userSkills.skillId, skillId),
          ),
        );

      if (!result.affectedRows || result.affectedRows === 0) {
        throw new NotFoundError("Skill", skillId);
      }

      return true;
    });
  }

  async searchCertifications(query: string) {
    return await withDbErrorHandling(async () => {
      const escaped = SecurityUtils.escapeLikePattern(query);
      return db
        .select()
        .from(certifications)
        .where(like(certifications.certificationName, `%${escaped}%`))
        .limit(20);
    });
  }

  async searchSkills(query: string) {
    return await withDbErrorHandling(async () => {
      const escaped = SecurityUtils.escapeLikePattern(query);
      return db
        .select()
        .from(skills)
        .where(like(skills.name, `%${escaped}%`))
        .limit(20);
    });
  }

  async countUserSkills(userProfileId: number) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .select({ count: count() })
        .from(userSkills)
        .where(eq(userSkills.userProfileId, userProfileId));
      return result?.count ?? 0;
    });
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
    const { page = 1, limit = 10 } = options;
    const offset = Math.max(0, (page - 1) * limit);

    const conditions = [];
    if (searchTerm) {
      const escaped = SecurityUtils.escapeLikePattern(searchTerm);
      conditions.push(
        or(
          like(user.fullName, `%${escaped}%`),
          like(user.email, `%${escaped}%`),
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
              skills: {
                with: { skill: true },
              },
            },
          },
        },
      }),
    );
  }

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

      const [totalResult] = await db
        .select({ total: count() })
        .from(savedJobs)
        .where(eq(savedJobs.userId, userId));
      const total = totalResult?.total ?? 0;

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;
      return {
        items: response,
        pagination: {
          total,
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

  async getSavedJobIdsForJobs(
    userId: number,
    jobIds: number[],
  ): Promise<Set<number>> {
    return withDbErrorHandling(async () => {
      const saved = await db.query.savedJobs.findMany({
        where: and(
          eq(savedJobs.userId, userId),
          inArray(savedJobs.jobId, jobIds),
        ),
        columns: { jobId: true },
      });

      return new Set(saved.map((s) => s.jobId));
    });
  }

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

  async getUserIntent(userId: number) {
    return await withDbErrorHandling(async () => {
      return db.query.userOnBoarding.findFirst({
        where: eq(userOnBoarding.userId, userId),
        columns: {
          intent: true,
          status: true,
        },
      });
    });
  }

  async completeOnboarding(userId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userOnBoarding)
        .set({ status: "completed" })
        .where(
          and(
            eq(userOnBoarding.userId, userId),
            eq(userOnBoarding.status, "pending"),
          ),
        );
      return result.affectedRows > 0;
    });
  }

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

      return db.query.userProfile.findFirst({
        where: eq(userProfile.userId, userId),
      });
    });
  }

  async updateWorkAvailability(userId: number, isAvailable: boolean) {
    return await withDbErrorHandling(async () => {
      const [result] = await db
        .update(userProfile)
        .set({ isAvailableForWork: isAvailable })
        .where(eq(userProfile.userId, userId));

      if (!result.affectedRows && result.affectedRows === 0) {
        throw new DatabaseError(
          `Failed to update work availability for userId: ${userId}`,
        );
      }

      return db.query.userProfile.findFirst({
        where: eq(userProfile.userId, userId),
      });
    });
  }
}
