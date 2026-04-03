export { createApplicationsModule } from "./composition-root";
export type { ApplicationsModule } from "./composition-root";
// Concrete export — used by composition-root.ts (circular dep resolution)
export { ApplicationsRepository } from "./repositories/applications.repository";
export { createOrgApplicationsRoutes } from "./routes/org-applications.routes";
export type { ApplicationsServicePort } from "./ports/applications-service.port";
export type { ApplicationsRepositoryPort } from "./ports/applications-repository.port";
export type { JobDetailsQueryPort } from "./ports/job-details-query.port";
export type { OrgMembershipQueryPort } from "./ports/org-membership-query.port";
export type { ApplicantQueryPort } from "./ports/applicant-query.port";
export { createApplicationsGuards } from "./guards/applications.guards";
export type { ApplicationsGuards } from "./guards/applications.guards";
export { createApplicationsRoutes } from "./routes/applications.routes";
export { createSavedJobRoutes } from "./routes/saved-job.routes";
export { SavedJobRepository } from "./repositories/saved-job.repository";
export type { SavedJobRepositoryPort } from "./ports/saved-job-repository.port";
export type { ApplicationSubmittedPayload } from "./events/application-submitted.event";
export { createApplicationSubmittedEvent } from "./events/application-submitted.event";
