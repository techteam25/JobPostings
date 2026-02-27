import { and, asc, desc, eq, inArray, like, or, sql, SQL } from "drizzle-orm";
import { SecurityUtils } from "@/utils/security";
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
import { DatabaseError, NotFoundError } from "@/utils/errors";

/**
 * Repository class for managing job-related database operations, including jobs and applications.
 */
export class JobRepository extends BaseRepository<typeof jobsDetails> {
  /**
   * Creates an instance of JobRepository.
   */
  constructor() {
    super(jobsDetails, "Job");
  }

  /**
   * Creates a new job with associated skills.
   * @param jobData The job data including skills.
   * @returns The created job with skills.
   */
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
          throw new DatabaseError("Failed to insert job");
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
            throw new DatabaseError("Failed to fetch skills");

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
          throw new NotFoundError(`Job with Id: ${jobId} not found`);
        }

        const skillsArray = jobWithSkills.skills.map((s) => s.skill.name);

        return {
          ...jobWithSkills,
          skills: skillsArray,
        };
      }),
    );
  }

  /**
   * Updates an existing job with associated skills.
   * @param jobData The updated job data including skills.
   * @param jobId The ID of the job to update.
   * @returns The updated job with skills.
   */
  async updateJob(jobData: UpdateJob, jobId: number): Promise<JobWithSkills> {
    return await withDbErrorHandling(async () =>
      db.transaction(async (transaction) => {
        const { skills: skillsPayload, ...jobPayload } = jobData;
        const [jobResult] = await transaction
          .update(jobsDetails)
          .set(jobPayload)
          .where(eq(jobsDetails.id, jobId));

        if (!jobResult.affectedRows || jobResult.affectedRows === 0) {
          throw new DatabaseError("Failed to update job");
        }

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
            throw new DatabaseError("Failed to fetch skills after update");

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
          throw new NotFoundError(`Job with Id: ${jobId} not found`);
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

  /**
   * Finds a job by its ID, including employer details.
   * @param id The ID of the job.
   * @returns The job with employer details.
   */
  async findJobById(id: number) {
    return withDbErrorHandling(async () => {
      const result = await db.query.jobsDetails.findFirst({
        where: eq(jobsDetails.id, id),
        with: {
          employer: {
            columns: {
              id: true,
              name: true,
              logoUrl: true,
              city: true,
              state: true,
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundError(`Job with Id: ${id} not found`);
      }
      const { employer, ...rest } = result;

      return {
        job: rest,
        employer,
      };
    });
  }

  /**
   * Finds active jobs with pagination.
   * @param options Pagination options including page and limit.
   * @returns An object containing the jobs and pagination metadata.
   */
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
              logoUrl: organizations.logoUrl,
            },
          })
          .from(jobsDetails)
          .leftJoin(organizations, eq(jobsDetails.employerId, organizations.id))
          .where(eq(jobsDetails.isActive, true))
          .orderBy(desc(jobsDetails.createdAt))
          .limit(limit)
          .offset(offset),
    );

    const total = await countRecords(
      jobsDetails,
      eq(jobsDetails.isActive, true),
    );
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  /**
   * Finds jobs by employer with optional filters and pagination.
   * @param employerId The ID of the employer.
   * @param options Pagination and search options.
   * @returns An object containing the jobs and pagination metadata.
   */
  async findJobsByEmployer(
    employerId: number,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      q?: string;
      order?: string;
    } = {},
  ) {
    const { page = 1, limit = 10, q, sortBy, order } = options;
    const offset = (page - 1) * limit;

    const whereCondition: SQL<unknown>[] = [
      eq(jobsDetails.employerId, employerId),
    ];

    if (q) {
      const escaped = SecurityUtils.escapeLikePattern(q);
      const searchCondition = or(
        like(jobsDetails.title, `%${escaped}%`),
        like(jobsDetails.description, `%${escaped}%`),
      );

      if (searchCondition) {
        whereCondition.push(searchCondition);
      }
    }

    let orderByCondition;
    if (sortBy) {
      const orderDirection = order === "asc" ? "asc" : "desc";
      switch (sortBy) {
        case "createdAt":
          orderByCondition =
            orderDirection === "asc"
              ? asc(jobsDetails.createdAt)
              : desc(jobsDetails.createdAt);
          break;
        case "applicationDeadline":
          orderByCondition =
            orderDirection === "asc"
              ? asc(jobsDetails.applicationDeadline)
              : desc(jobsDetails.applicationDeadline);
          break;
        default:
          orderByCondition = desc(jobsDetails.createdAt);
      }
    } else {
      orderByCondition = desc(jobsDetails.createdAt);
    }

    const items = await withDbErrorHandling(
      async () =>
        await db
          .select()
          .from(jobsDetails)
          .where(and(...whereCondition))
          .orderBy(orderByCondition)
          .limit(limit)
          .offset(offset),
    );

    const total = await countRecords(jobsDetails, and(...whereCondition));
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  /**
   * Finds a job with its applications and employer details.
   * @param jobId The ID of the job.
   * @returns The job with applications and employer details.
   */
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
          .where(eq(jobsDetails.id, jobId)),
    );
  }

  // Job Applications
  /**
   * Creates a new job application and increments job view count.
   * @param applicationData The application data.
   * @returns The ID of the created application.
   */
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
            applicationCount: sql`(${jobInsights.applicationCount} + 1)`,
          })
          .where(eq(jobInsights.job, applicationData.jobId));

        return applicationId;
      }),
    );
    return result?.id;
  }

  /**
   * Finds applications for a specific job with pagination and optional status filter.
   * @param jobId The ID of the job.
   * @param options Pagination and status options.
   * @returns An object containing the applications and pagination metadata.
   */
  async findApplicationsByJob(
    jobId: number,
    options: { page?: number; limit?: number; status?: string } = {},
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
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[]),
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
          .offset(offset),
    );

    const total = await countRecords(jobApplications, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  /**
   * Finds applications submitted by a specific user with pagination and optional status filter.
   * @param userId The ID of the user.
   * @param appliedJobIds Optional list of job IDs the user has applied to.
   * @param options Pagination and status options.
   * @returns An object containing the applications and pagination metadata.
   */
  async findApplicationsByUser(
    userId: number,
    appliedJobIds?: number[],
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
    } = {},
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
            | "withdrawn",
        ),
      );
    }

    if (appliedJobIds && appliedJobIds.length > 0) {
      whereConditions.push(inArray(jobApplications.jobId, appliedJobIds));
    }

    const where = and(
      ...(whereConditions.filter((c) => c !== undefined) as SQL<unknown>[]),
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
          .offset(offset),
    );

    const total = await countRecords(jobApplications, where);
    const pagination = calculatePagination(total, page, limit);

    return { items, pagination };
  }

  /**
   * Updates the status of a job application.
   * @param applicationId The ID of the application.
   * @param updateData The data to update.
   * @returns True if the update was successful, false otherwise.
   */
  async updateApplicationStatus(
    applicationId: number,
    updateData: UpdateJobApplication,
  ) {
    const [result] = await withDbErrorHandling(
      async () =>
        await db
          .update(jobApplications)
          .set(updateData)
          .where(eq(jobApplications.id, applicationId)),
    );

    return result.affectedRows > 0;
  }

  /**
   * Finds a job application by its ID, including job and applicant details.
   * @param applicationId The ID of the application.
   * @returns The application with job and applicant details.
   */
  async findApplicationById(applicationId: number) {
    return withDbErrorHandling(async () => {
      const result = await db
        .select({
          application: {
            id: jobApplications.id,
            jobId: jobApplications.jobId,
            applicantId: jobApplications.applicantId,
            status: jobApplications.status,
            reviewedAt: jobApplications.reviewedAt,
            appliedAt: jobApplications.appliedAt,
            coverLetter: jobApplications.coverLetter,
            resumeUrl: jobApplications.resumeUrl,
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
          applicant: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        })
        .from(jobApplications)
        .where(eq(jobApplications.id, applicationId))
        .innerJoin(jobsDetails, eq(jobApplications.jobId, jobsDetails.id))
        .innerJoin(user, eq(jobApplications.applicantId, user.id));

      return result[0] || null;
    });
  }

  /**
   * Checks if a user has applied to a specific job.
   * @param userId The ID of the user.
   * @param jobId The ID of the job.
   * @returns True if the user has applied, false otherwise.
   */
  async hasUserAppliedToJob(userId: number, jobId: number): Promise<boolean> {
    return await withDbErrorHandling(async () => {
      const result = await db
        .select()
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.applicantId, userId),
            eq(jobApplications.jobId, jobId),
          ),
        )
        .limit(1);

      return result.length > 0;
    });
  }

  /**
   * Deletes all job applications for a specific user.
   * @param userId The ID of the user.
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteJobApplicationsByUserId(userId: number): Promise<void> {
    return withDbErrorHandling(async () => {
      await db
        .delete(jobApplications)
        .where(eq(jobApplications.applicantId, userId));
    });
  }

  /**
   * Finds a job by its ID, including associated skills.
   * @param jobId The ID of the job.
   * @returns The job with skills.
   */
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
        throw new NotFoundError(`Job with Id: ${jobId} not found`);
      }

      const skillsArray = jobWithSkills.skills.map((s) => s.skill.name);

      return {
        ...jobWithSkills,
        skills: skillsArray,
      };
    });
  }
}
