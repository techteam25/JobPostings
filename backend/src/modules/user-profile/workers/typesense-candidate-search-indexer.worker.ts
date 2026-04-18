import { Job as BullMqJob } from "bullmq";
import type { ProfileRepositoryPort } from "@/modules/user-profile";
import type { TypesenseProfileServicePort } from "@shared/ports/typesense-profile-service.port";
import logger from "@shared/logger";
import {
  QUEUE_NAMES,
  queueService,
} from "@shared/infrastructure/queue.service";
import type { ModuleWorkers } from "@shared/types/module-workers";
import {
  buildCandidateSearchDocument,
  type CandidateSearchBuilderInput,
} from "../helpers/build-candidate-search-document";

export interface CandidateSearchIndexerJobData {
  userId: number;
  correlationId: string;
}

interface CandidateSearchIndexerDeps {
  typesenseProfileService: TypesenseProfileServicePort;
  profileRepository: ProfileRepositoryPort;
}

async function loadBuilderInput(
  deps: CandidateSearchIndexerDeps,
  userId: number,
): Promise<CandidateSearchBuilderInput | null> {
  const userRow = await deps.profileRepository.findByIdWithProfile(userId);
  if (!userRow) return null;

  const profile = userRow.profile;
  const workExperiences =
    profile?.workExperiences?.map((we) => ({
      jobTitle: we.jobTitle ?? "",
      current: we.current ?? false,
      startDate: we.startDate,
      endDate: we.endDate ?? null,
    })) ?? [];

  const skills =
    profile?.skills
      ?.map((s) => s.skill?.name)
      .filter((v): v is string => Boolean(v && v.trim())) ?? [];

  return {
    user: {
      id: userRow.id,
      fullName: userRow.fullName,
      intent: userRow.intent,
      deletedAt: userRow.deletedAt ?? null,
    },
    userProfile: profile
      ? {
          profilePicture: profile.profilePicture ?? null,
          bio: profile.bio ?? null,
          city: profile.city ?? null,
          state: profile.state ?? null,
          country: profile.country ?? null,
          isProfilePublic: profile.isProfilePublic,
          isAvailableForWork: profile.isAvailableForWork,
        }
      : null,
    workExperiences,
    skills,
  };
}

function createCandidateSearchIndexerHandler(deps: CandidateSearchIndexerDeps) {
  return async function indexCandidateSearchProfile(
    job: BullMqJob<CandidateSearchIndexerJobData>,
  ): Promise<void> {
    const { userId, correlationId } = job.data;

    logger.info("Processing Typesense candidate-search indexing job", {
      jobId: job.id,
      jobName: job.name,
      userId,
      correlationId,
    });

    const startTime = Date.now();

    try {
      switch (job.name) {
        case "indexProfile":
        case "updateProfile": {
          const input = await loadBuilderInput(deps, userId);

          // User missing (deactivated/deleted/cascade) → remove from index.
          if (!input) {
            await deps.typesenseProfileService.deleteProfile(String(userId));
            break;
          }

          const doc = buildCandidateSearchDocument(input);
          if (!doc) {
            // Ineligible (non-seeker, private profile, deleted) → remove.
            await deps.typesenseProfileService.deleteProfile(String(userId));
            break;
          }

          await deps.typesenseProfileService.upsertProfile(doc);
          break;
        }
        case "deleteProfile":
          await deps.typesenseProfileService.deleteProfile(String(userId));
          break;
        default:
          logger.warn(
            "Unknown job name for Typesense candidate-search indexing",
            {
              jobName: job.name,
            },
          );
      }
    } catch (error) {
      logger.error("Error processing Typesense candidate-search indexing", {
        jobId: job.id,
        jobName: job.name,
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId,
      });
      throw error;
    }

    const duration = Date.now() - startTime;
    logger.info("Completed Typesense candidate-search indexing", {
      jobId: job.id,
      jobName: job.name,
      durationMs: duration,
      correlationId,
    });
  };
}

export function createTypesenseCandidateSearchIndexerWorker(
  deps: CandidateSearchIndexerDeps,
): ModuleWorkers {
  return {
    initialize() {
      queueService.registerWorker<CandidateSearchIndexerJobData, void>(
        QUEUE_NAMES.TYPESENSE_CANDIDATE_SEARCH_PROFILE_QUEUE,
        createCandidateSearchIndexerHandler(deps),
        {
          concurrency: 5,
          limiter: {
            max: 50,
            duration: 60000,
          },
        },
      );

      logger.info("Typesense candidate-search profile worker initialized");
    },

    async scheduleJobs() {
      // Candidate-search indexer has no scheduled jobs — jobs are enqueued on demand
    },
  };
}
