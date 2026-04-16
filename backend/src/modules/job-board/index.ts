export { createJobBoardModule } from "./composition-root";
export type { JobBoardModule } from "./composition-root";
// Concrete exports — used by composition-root.ts (circular dep) and workers
export { JobBoardRepository } from "./repositories/job-board.repository";
export { JobInsightsRepository } from "./repositories/job-insights.repository";
export type { JobBoardServicePort } from "./ports/job-board-service.port";
export type { JobBoardRepositoryPort } from "./ports/job-board-repository.port";
export type { JobInsightsRepositoryPort } from "./ports/job-insights-repository.port";
export type { ApplicationStatusQueryPort } from "./ports/application-status-query.port";
export type { SavedJobsStatusQueryPort } from "./ports/saved-jobs-status-query.port";
export type { OrgMembershipForJobPort } from "./ports/org-membership-for-job.port";
export type { UserContactQueryPort } from "./ports/user-contact-query.port";
export type {
  UserRecommendationProfilePort,
  RecommendationProfile,
} from "./ports/user-recommendation-profile.port";
export { createJobBoardGuards } from "./guards/job-board.guards";
export type { JobBoardGuards } from "./guards/job-board.guards";
export { createJobBoardRoutes } from "./routes/job-board.routes";
