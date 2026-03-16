import { and, asc, desc, eq, inArray, like, or, sql, SQL } from "drizzle-orm";
import { SecurityUtils } from "@shared/utils/security";
import { jobsDetails, jobSkills, organizations, skills } from "@/db/schema";
import { BaseRepository } from "@shared/base/base.repository";
import { db } from "@shared/db/connection";
import { calculatePagination, countRecords } from "@shared/db/utils";
import { withDbErrorHandling } from "@shared/db/dbErrorHandler";
import type {
  JobSkills,
  JobWithSkills,
  NewJob,
  UpdateJob,
} from "@/validations/job.validation";
import { DatabaseError, NotFoundError } from "@shared/errors";
import type { JobBoardRepositoryPort } from "@/modules/job-board";

export class JobBoardRepository
  extends BaseRepository<typeof jobsDetails>
  implements JobBoardRepositoryPort
{
  constructor() {
    super(jobsDetails, "Job");
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
          throw new DatabaseError("Failed to insert job");
        }

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

        if (skillsPayload && skillsPayload.length > 0) {
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
