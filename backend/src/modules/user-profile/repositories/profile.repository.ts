import { and, count, eq, like, or, sql } from "drizzle-orm";
import {
  certifications,
  educations,
  user,
  userCertifications,
  userOnBoarding,
  userProfile,
  workExperiences,
} from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import { db } from "@shared/db/connection";
import { DatabaseError } from "@shared/errors";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import { SecurityUtils } from "@shared/utils/security";
import type {
  NewUserProfile,
  UpdateUserProfile,
  User,
} from "@/validations/userProfile.validation";

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
            intent: true,
            onboardingStatus: true,
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
        intent: true,
        onboardingStatus: true,
      },
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
              intent: user.intent,
              onboardingStatus: user.onboardingStatus,
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

  async initializeUserIntent(
    userId: number,
    intent: "seeker" | "employer",
  ): Promise<void> {
    // Source of truth only — the denormalized copy on the user table
    // is synced via IdentityWritePort at the service layer.
    //
    // Idempotent: this is called from the Better-Auth `/callback/:id`
    // after-hook, which fires on every OAuth sign-in (not just the
    // first). Repeat callbacks must not overwrite a user's existing
    // intent/status, so we set user_id = user_id to make ON DUPLICATE
    // KEY UPDATE a true no-op.
    await withDbErrorHandling(async () => {
      await db
        .insert(userOnBoarding)
        .values({
          userId,
          intent,
          status: "pending",
        })
        .onDuplicateKeyUpdate({ set: { userId: sql`user_id` } });
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
