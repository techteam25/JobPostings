export { createUserProfileModule } from "./composition-root";
export type { UserProfileModule } from "./composition-root";
export type { ProfileServicePort } from "./ports/profile-service.port";
export type { ProfileRepositoryPort } from "./ports/profile-repository.port";
export type {
  OrgRoleQueryPort,
  UserOrganizationsQueryPort,
} from "./ports/org-query.port";
export { createProfileGuards } from "./guards/profile.guards";
export type { ProfileGuards } from "./guards/profile.guards";
export { createProfileRoutes } from "./routes/profile.routes";
export { createJobPreferenceRoutes } from "./routes/job-preference.routes";
export { createWorkAreaRoutes } from "./routes/work-area.routes";
export type { PreferenceServicePort } from "./ports/preference-service.port";
export type {
  PreferenceRepositoryPort,
  JobPreference,
} from "./ports/preference-repository.port";
export type {
  WorkAreaRepositoryPort,
  WorkAreaQueryPort,
  WorkArea,
} from "./ports/work-area-repository.port";
export type { WorkAreaServicePort } from "./ports/work-area-service.port";
