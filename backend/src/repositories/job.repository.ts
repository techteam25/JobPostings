import { and, desc, eq, inArray, sql, SQL } from "drizzle-orm";
import {
  jobApplications,
  jobInsights,
  jobsDetails,
  jobSkills,
  organizations,
  skills,
  user,
} from "@/db/schema";
import { BaseRepository } from "./base.repository";
import { db } from "@/db/connection";
import { calculatePagination, countRecords } from "@/db/utils";
import { withDbErrorHandling } from "@/db/dbErrorHandler";
import {
  JobSkills,
  JobWithSkills,
  NewJob,
  NewJobApplication,
  UpdateJob,
  UpdateJobApplication,
} from "@/validations/job.validation";

export class JobRepository extends BaseRepository<typeof jobsDetails> {
  constructor() {
    super(jobsDetails);
  }

  async createJob(
    jobData: NewJob & { skills: JobSkills["name"][] },
  ): Promise<JobWithSkills> {
    return await withDbErrorHandling(async () =>
      db.transaction(async (transaction) => {
        const { skills: skillsPayload, ...jobPayload } = jobData;
        const [jobId] = await transaction
          .insert(jobsDetails)
          .values(jobPayload)
          .$returningId();

        if (!jobId) {
          throw new Error("Failed to insert job");
        }

        // Initialize job skills if provided
        if (skillsPayload && skillsPayload.length > 0) {
          const skillInserts = skillsPayload.map((skillName) => ({
            name: skillName,
          }));

          await transaction
            .insert(skills)
            .values(skillInserts)
            .onDuplicateKeyUpdate({
              set: {
                name: sql`values(${skills.name})`,
              },
            });

          const allSkills = await transaction
            .select({ id: skills.id })
            .from(skills)
            .where(inArray(skills.name, skillsPayload));

          if (!allSkills || allSkills.length === 0)
            throw new Error("Failed to fetch skills");

          const jobSkillInserts = allSkills.map((s) => ({
            jobId: jobId.id,
            skillId: s.id,
            isRequired: true,
          }));

          await transaction
            .insert(jobSkills)
            .values(jobSkillInserts)
            .onDuplicateKeyUpdate({
              set: {
                isRequired: sql`values(${jobSkills.isRequired})`,
              },
            });
        }
        const jobWithSkills = await transaction.query.jobsDetails.findFirst({
          where: eq(jobsDetails.id, jobId.id),
          with: {
            skills: {
              with: {
                skill: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
            employer: {
              columns: {
                name: true,
              },
            },
          },
        });

        if (!jobWithSkills) {
          throw new Error(`Job with Id: ${jobId} not found`);
        }

        const skillsArray = jobWithSkills.skills.map((s) => s.skill.name);

        return {
          ...jobWithSkills,
          skills: skillsArray,
        };
      }),
    );
  }

  async updateJob(jobData: UpdateJob, jobId: number): Promise<JobWithSkills> {
    return await withDbErrorHandling(async () =>
      db.transaction(async (transaction) => {
        const { skills: skillsPayload, ...jobPayload } = jobData;
        const [jobResult] = await transaction
          .update(jobsDetails)
          .set(jobPayload)
          .where(eq(jobsDetails.id, jobId))

        // Initialize job skills if provided
        if (skillsPayload && skillsPayload.length > 0) {
          // Delete existing job-skill associations
          await transaction.delete(jobSkills).where(eq(jobSkills.jobId, jobId));

          const skillUpdate = skillsPayload.map((name) => ({
            name,
          }));

          await transaction
            .insert(skills)
            .values(skillUpdate)
            .onDuplicateKeyUpdate({
              set: {
                name: sql`values(${skills.name})`,
              },
            });

          const allSkills = await transaction
            .select({ id: skills.id })
            .from(skills)
            .where(inArray(skills.name, skillsPayload));

          if (!allSkills || allSkills.length === 0)
            throw new Error("Failed to fetch skills after update");

          const jobSkillInserts = allSkills.map((s) => ({
            jobId,
            skillId: s.id,
            isRequired: true,
          }));

          await transaction
            .insert(jobSkills)
            .values(jobSkillInserts)
            .onDuplicateKeyUpdate({
              set: { isRequired: sql`values(${jobSkills.isRequired})` },
            });
        }
        const updatedJobWithSkills =
          await transaction.query.jobsDetails.findFirst({
            where: eq(jobsDetails.id, jobId),
            with: {
              skills: {
                with: {
                  skill: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
              employer: {
                columns: {
                  name: true,
                },
              },
            },
          });

        if (!updatedJobWithSkills) {
          throw new Error(`Job with Id: ${jobId} not found`);
        }

        const skillsArray = updatedJobWithSkills.skills.map(
          (s) => s.skill.name,
        );

        return {
          ...updatedJobWithSkills,
          skills: skillsArray,
        };
      }),
    );
  }

  async findActiveJobs(options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select({
            job: jobsDetails,
            employer: {
              id: organizations.id,
              name: organizations.name,
              city: organizations.city,
              state: organizations.state,
            },
          })
          .from(jobsDetails)
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
          .where(eq(jobsDetails.isActive, true))
          .orderBy(desc(jobsDetails.createdAt))
          .limit(limit)
          .offset(offset)
    );

    const total = await countRecords(
      jobsDetails,
      eq(jobsDetails.isActive, true)
    );
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findJobsByEmployer(
    employerId: number,
    options: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const whereCondition = eq(jobsDetails.employerId, employerId);

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(jobsDetails)
          .where(whereCondition)
          .orderBy(desc(jobsDetails.createdAt))
          .limit(limit)
          .offset(offset)
    );

    const total = await countRecords(jobsDetails, whereCondition);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async countActiveJobsByEmployer(employerId: number): Promise<number> {
    const whereCondition = and(
      eq(jobsDetails.employerId, employerId),
      eq(jobsDetails.isActive, true)
    );

    return await countRecords(jobsDetails, whereCondition);
  }

  async findJobWithApplications(jobId: number) {
    return withDbErrorHandling(
      async () =>
        await db
          .select({
            job: jobsDetails,
            employer: organizations,
            applications: jobApplications,
            applicant: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
            },
          })
          .from(jobsDetails)
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
          .leftJoin(jobApplications, eq(jobsDetails.id, jobApplications.jobId))
          .leftJoin(user, eq(jobApplications.applicantId, user.id))
          .where(eq(jobsDetails.id, jobId))
    );
  }

  // Job Applications
  async createApplication(applicationData: NewJobApplication) {
    const result = await withDbErrorHandling(async () =>
      db.transaction(async (transaction) => {
        const [applicationId] = await transaction
          .insert(jobApplications)
          .values(applicationData)
          .$returningId();

        await transaction
          .update(jobInsights)
          .set({
            applicationCount: sql`${jobInsights.applicationCount} + 1`,
          })
          .where(eq(jobInsights.job, applicationData.jobId));

        return applicationId;
      })
    );
    return result?.id;
  }

  async findApplicationsByJob(
    jobId: number,
    options: { page?: number; limit?: number; status?: string } = {}
  ) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL<unknown> | undefined)[] = [
      eq(jobApplications.jobId, jobId),
    ];
    if (status) {
      whereConditions.push(eq(jobApplications.status, status as any));
    }

    const where = and(
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[])
    );

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select({
            application: jobApplications,
            applicant: {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
            },
          })
          .from(jobApplications)
          .innerJoin(user, eq(jobApplications.applicantId, user.id))
          .where(where)
          .orderBy(desc(jobApplications.appliedAt))
          .limit(limit)
          .offset(offset)
    );

    const total = await countRecords(jobApplications, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  async findApplicationsByUser(
    userId: number,
    options: {
      page?: number;
      limit?: number;
      status?:
        | "pending"
        | "reviewed"
        | "shortlisted"
        | "interviewing"
        | "rejected"
        | "hired"
        | "withdrawn";
    } = {}
  ) {
    const { page = 1, limit = 10, status } = options;
    const offset = (page - 1) * limit;

    const whereConditions: (SQL<unknown> | undefined)[] = [
      eq(jobApplications.applicantId, userId),
    ];
    if (status) {
      whereConditions.push(
        eq(
          jobApplications.status,
          status as
            | "pending"
            | "reviewed"
            | "shortlisted"
            | "interviewing"
            | "rejected"
            | "hired"
            | "withdrawn"
        )
      );
    }

    const where = and(
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[])
    );

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select({
            application: jobApplications,
            job: {
              id: jobsDetails.id,
              title: jobsDetails.title,
              city: jobsDetails.city,
              state: jobsDetails.state,
              country: jobsDetails.country,
              zipcode: jobsDetails.zipcode,
              isRemote: jobsDetails.isRemote,
              jobType: jobsDetails.jobType,
            },
            employer: {
              id: organizations.id,
              name: organizations.name,
            },
          })
          .from(jobApplications)
          .leftJoin(jobsDetails, eq(jobApplications.jobId, jobsDetails.id))
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
          .where(where)
          .orderBy(desc(jobApplications.appliedAt))
          .limit(limit)
          .offset(offset)
    );

    const total = await countRecords(jobApplications, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

async updateApplicationStatus(
  applicationId: number,
  updateData: UpdateJobApplication & { notes?: string; reviewedAt?: Date }
) {
  // Update the status
  const statusUpdateData: Partial<UpdateJobApplication & { notes?: string }> = {};
  if (updateData.status) statusUpdateData.status = updateData.status;
  if (updateData.notes) statusUpdateData.notes = updateData.notes;

  // Update reviewedAt separately only if applicable
  const reviewedAtUpdateData: Partial<{ reviewedAt?: Date }> = {};
  if (updateData.status === "reviewed") {
    reviewedAtUpdateData.reviewedAt = updateData.reviewedAt || new Date();
  }

  // Perform database updates 
  const updateStatusResult = await withDbErrorHandling(async () =>
    db
      .update(jobApplications)
      .set(statusUpdateData)
      .where(eq(jobApplications.id, applicationId))
  );

  if (updateStatusResult[0].affectedRows === 0) return false;

  if (Object.keys(reviewedAtUpdateData).length > 0) {
    await withDbErrorHandling(async () =>
      db
        .update(jobApplications)
        .set(reviewedAtUpdateData)
        .where(eq(jobApplications.id, applicationId))
    );
  }

  return true;
}


  async findApplicationById(applicationId: number) {
    return withDbErrorHandling(
      async () =>
        await db
          .select({
            application: {
              id: jobApplications.id,
              jobId: jobApplications.jobId,
              reviewedAt: jobApplications.reviewedAt,
              applicantId: jobApplications.applicantId,
              status: jobApplications.status,
            },
            job: {
              id: jobsDetails.id,
              title: jobsDetails.title,
              city: jobsDetails.city,
              state: jobsDetails.state,
              country: jobsDetails.country,
              zipcode: jobsDetails.zipcode,
              isRemote: jobsDetails.isRemote,
              jobType: jobsDetails.jobType,
              employerId: jobsDetails.employerId,
            },
            user: {
              id: user.id,
              email: user.email,
              fullName: user.fullName,
            },
            employer: {
              id: organizations.id,
              name: organizations.name,
            },
          })
          .from(jobApplications)
          .where(eq(jobApplications.id, applicationId))
          .innerJoin(jobsDetails, eq(jobApplications.jobId, jobsDetails.id))
          .innerJoin(user, eq(jobApplications.applicantId, user.id))
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
    );
  }

  async hasUserAppliedToJob(userId: number, jobId: number) {
    return await withDbErrorHandling(
      async () =>
        await db
          .select({ exists: sql`SELECT 1` })
          .from(jobApplications)
          .where(
            and(
              eq(jobApplications.applicantId, userId),
              eq(jobApplications.jobId, jobId)
            )
          )
          .limit(1)
          .then((result) => result.length > 0)
    );
  }

  async deleteJobApplicationsByUserId(userId: number): Promise<void> {
    return withDbErrorHandling(async () => {
      await db
        .delete(jobApplications)
        .where(eq(jobApplications.applicantId, userId));
    });
  }

  async findJobByIdWithSkills(jobId: number) {
    return withDbErrorHandling(async () => {
      const jobWithSkills = await db.query.jobsDetails.findFirst({
        where: eq(jobsDetails.id, jobId),
        with: {
          skills: {
            with: {
              skill: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!jobWithSkills) {
        throw new Error(`Job with Id: ${jobId} not found`);
      }

      const skillsArray = jobWithSkills.skills.map((s) => s.skill.name);

      return {
        ...jobWithSkills,
        skills: skillsArray,
      };
    });
  }
}
