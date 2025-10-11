import { JobRepository } from "@/repositories/job.repository";
import { UserRepository } from "@/repositories/user.repository";
import { BaseService } from "./base.service";
import { Job, userProfile, UserWithProfile } from "@/db/schema";
import { User } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/utils/errors";

interface JobMatchScore {
  job: Job;
  score: number;
  matchReasons: string[];
}

interface SkillMatch {
  skill: string;
  weight: number;
}

export class JobMatchingService extends BaseService {
  private jobRepository: JobRepository;
  private userRepository: UserRepository;

  constructor() {
    super();
    this.jobRepository = new JobRepository();
    this.userRepository = new UserRepository();
  }

  async getRecommendedJobs(
    userId: number,
    options: { page?: number; limit?: number } = {},
  ) {
    try {
      const { page = 1, limit = 10 } = options;

      // Get user profile with education, work experience, and certifications
      const user = await this.userRepository.findByIdWithProfile(userId);
      if (!user) {
        return this.handleError(new NotFoundError("User", userId));
      }

      // Get user's application history to avoid recommending already applied jobs
      const userApplications = await this.jobRepository.findApplicationsByUser(
        user.id,
      );

      const appliedJobIds = userApplications.items
        .map((app) => app.job?.id)
        .filter(Boolean);

      // Get all active jobs
      const activeJobs = await this.jobRepository.findActiveJobs({
        page: 1,
        limit: 1000,
      });

      // Filter out already applied jobs
      const availableJobs = activeJobs.items.filter(
        (item) => !appliedJobIds.includes(item.job.id),
      );

      // Calculate match scores
      const jobScores = await Promise.all(
        availableJobs.map(async (item) => {
          const score = await this.calculateJobMatchScore(user, item.job);
          return {
            ...item,
            score: score.score,
            matchReasons: score.matchReasons,
          };
        }),
      );

      // Sort by score (descending)
      jobScores.sort((a, b) => b.score - a.score);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = jobScores.slice(startIndex, endIndex);

      // Calculate pagination metadata
      const total = jobScores.length;
      const totalPages = Math.ceil(total / limit);

      return {
        items: paginatedResults,
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
    } catch (error) {
      this.handleError(error);
    }
  }

  async getSimilarJobs(jobId: number, limit: number = 5): Promise<Job[]> {
    const baseJob = await this.jobRepository.findById(jobId);
    if (!baseJob) {
      return this.handleError(new NotFoundError("Job", jobId));
    }

    // Get all active jobs except the base job
    const activeJobs = await this.jobRepository.findActiveJobs({
      page: 1,
      limit: 1000,
    });
    const otherJobs = activeJobs.items
      .map((item) => item.job)
      .filter((job) => job.id !== jobId);

    // Calculate similarity scores
    const similarityScores = otherJobs.map((job) => ({
      job,
      similarity: this.calculateJobSimilarity(baseJob, job),
    }));

    // Sort by similarity (descending) and return top results
    return similarityScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map((item) => item.job);
  }

  async findCandidatesForJob(
    jobId: number,
    options: { page?: number; limit?: number } = {},
  ) {
    try {
      const { page = 1, limit = 10 } = options;

      const job = await this.jobRepository.findById(jobId);
      if (!job) {
        return this.handleError(new NotFoundError("Job", jobId));
      }

      // Get all active users with user role
      const activeUsers = await this.userRepository.findActiveUsersByRole();

      // Get users who haven't applied for this job
      const jobApplications =
        await this.jobRepository.findApplicationsByJob(jobId);
      const appliedUserIds = jobApplications.items
        .map((app) => app.applicant?.id)
        .filter(Boolean);

      const availableUsers = activeUsers.filter(
        (user) => !appliedUserIds.includes(user.id),
      );

      // Calculate match scores
      const userScores = await Promise.all(
        availableUsers.map(async (user) => {
          const score = await this.calculateUserJobMatchScore(user, job);
          return {
            user,
            score: score.score,
            matchReasons: score.matchReasons,
          };
        }),
      );

      // Sort by score (descending)
      userScores.sort((a, b) => b.score - a.score);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = userScores.slice(startIndex, endIndex);

      const total = userScores.length;
      const totalPages = Math.ceil(total / limit);

      return {
        items: paginatedResults,
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
    } catch (error) {
      this.handleError(error);
    }
  }

  // Todo: Implement an objective scoring function
  private async calculateJobMatchScore(
    user: UserWithProfile,
    job: Job,
  ): Promise<{ score: number; matchReasons: string[] }> {
    let score = 0;
    const matchReasons: string[] = [];
    const maxScore = 100;

    // Location match (20 points)
    if (job.isRemote) {
      score += 20;
      matchReasons.push("Remote work available");
    } else if (
      user.profile?.city &&
      job.location.toLowerCase().includes(user.profile.city.toLowerCase())
    ) {
      score += 20;
      matchReasons.push("Location match");
    } else if (
      user.profile?.state &&
      job.location.toLowerCase().includes(user.profile.state.toLowerCase())
    ) {
      score += 10;
      matchReasons.push("State match");
    }

    // Skills match (30 points)
    // if (job.requiredSkills && user.profile?.bio) {
    //   const requiredSkills = this.extractSkills(job.requiredSkills);
    //   const userSkills = this.extractSkills(user.profile.bio);
    //   const matchedSkills = this.findMatchingSkills(requiredSkills, userSkills);
    //
    //   if (matchedSkills.length > 0) {
    //     const skillScore = Math.min(
    //       30,
    //       (matchedSkills.length / requiredSkills.length) * 30,
    //     );
    //     score += skillScore;
    //     matchReasons.push(
    //       `Matching skills: ${matchedSkills.slice(0, 3).join(", ")}`,
    //     );
    //   }
    // }

    // Experience level match (25 points)
    // This would require implementing experience calculation from work history
    // For now, we'll use a simplified approach
    const userExperienceLevel = this.estimateUserExperienceLevel(user);
    if (userExperienceLevel === job.experience) {
      score += 25;
      matchReasons.push(`Experience level match: ${job.experience}`);
    } else if (
      this.isCompatibleExperienceLevel(userExperienceLevel, job.experience!)
    ) {
      score += 15;
      matchReasons.push(`Compatible experience level`);
    }

    // Job type preference (15 points)
    // This would be based on user preferences stored in profile
    if (job.jobType === "full-time") {
      score += 10; // Assume most users prefer full-time
      matchReasons.push("Full-time position");
    }

    // Compensation match (10 points)
    if (job.compensationType === "paid" && job.salaryMin) {
      score += 10;
      matchReasons.push("Paid position");
    }

    return {
      score: Math.min(score, maxScore),
      matchReasons: matchReasons.slice(0, 5), // Limit to top 5 reasons
    };
  }

  // Todo: Implement an objective similarity function
  private async calculateUserJobMatchScore(
    user: UserWithProfile,
    job: Job,
  ): Promise<{ score: number; matchReasons: string[] }> {
    // This is the inverse of calculateJobMatchScore - finding users for a job
    return this.calculateJobMatchScore(user, job);
  }

  private calculateJobSimilarity(job1: Job, job2: Job): number {
    let similarity = 0;

    // Same job type (25 points)
    if (job1.jobType === job2.jobType) {
      similarity += 25;
    }

    // Same experience level (20 points)
    if (job1.experience === job2.experience) {
      similarity += 20;
    }

    // Same compensation type (15 points)
    if (job1.compensationType === job2.compensationType) {
      similarity += 15;
    }

    // Remote work similarity (10 points)
    if (job1.isRemote === job2.isRemote) {
      similarity += 10;
    }

    // Location similarity (10 points)
    if (job1.location === job2.location) {
      similarity += 10;
    } else if (this.isSimilarLocation(job1.location, job2.location)) {
      similarity += 5;
    }

    // Skills similarity (20 points)
    // if (job1.requiredSkills && job2.requiredSkills) {
    //   const skills1 = this.extractSkills(job1.requiredSkills);
    //   const skills2 = this.extractSkills(job2.requiredSkills);
    //   const matchedSkills = this.findMatchingSkills(skills1, skills2);
    //
    //   if (skills1.length > 0 && skills2.length > 0) {
    //     const skillSimilarity =
    //       (matchedSkills.length / Math.max(skills1.length, skills2.length)) *
    //       20;
    //     similarity += skillSimilarity;
    //   }
    // }

    return similarity;
  }

  // private extractSkills(text: string): string[] {
  //   // This is a simplified skill extraction
  //   // In production, you'd use NLP or maintain a skills database
  //   const commonSkills = [
  //     "javascript",
  //     "python",
  //     "java",
  //     "react",
  //     "node.js",
  //     "sql",
  //     "html",
  //     "css",
  //     "typescript",
  //     "angular",
  //     "vue.js",
  //     "php",
  //     "c#",
  //     "c++",
  //     "ruby",
  //     "go",
  //     "docker",
  //     "kubernetes",
  //     "aws",
  //     "azure",
  //     "git",
  //     "linux",
  //     "mongodb",
  //     "postgresql",
  //     "leadership",
  //     "communication",
  //     "project management",
  //     "teamwork",
  //     "problem solving",
  //     "marketing",
  //     "sales",
  //     "customer service",
  //     "accounting",
  //     "finance",
  //     "hr",
  //   ];
  //
  //   const lowerText = text.toLowerCase();
  //   return commonSkills.filter((skill) =>
  //     lowerText.includes(skill.toLowerCase()),
  //   );
  // }

  private findMatchingSkills(skills1: string[], skills2: string[]): string[] {
    return skills1.filter((skill) =>
      skills2.some((s) => s.toLowerCase() === skill.toLowerCase()),
    );
  }

  private estimateUserExperienceLevel(user: User): string {
    // This would analyze work experience duration
    // For now, return a default value
    return "mid";
  }

  private isCompatibleExperienceLevel(
    userLevel: string,
    jobLevel: string,
  ): boolean {
    const levels = ["entry", "mid", "senior", "lead", "executive"];
    const userIndex = levels.indexOf(userLevel);
    const jobIndex = levels.indexOf(jobLevel);

    // Allow applying to same level or one level up/down
    return Math.abs(userIndex - jobIndex) <= 1;
  }

  private isSimilarLocation(location1: string, location2: string): boolean {
    // Extract city/state and compare
    const clean1 = location1
      .toLowerCase()
      .replace(/[,\s]+/g, " ")
      .trim();
    const clean2 = location2
      .toLowerCase()
      .replace(/[,\s]+/g, " ")
      .trim();

    const words1 = clean1.split(" ");
    const words2 = clean2.split(" ");

    // Check if they share common words (city or state)
    return words1.some((word) => words2.includes(word) && word.length > 2);
  }
}
