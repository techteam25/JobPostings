// Shared infrastructure ports (canonical location: @shared/ports/)
// Re-exported here for backward compatibility with old facades and workers.
export type { EmailServicePort } from "@shared/ports/email-service.port";
export type { TypesenseServicePort } from "@shared/ports/typesense-service.port";
export type { BaseRepositoryPort } from "@shared/ports/base-repository.port";

// Facade-era ports — still needed by old facades, workers, and email.service.ts.
// These will be removed when facades and workers are migrated (Phases 8–9).
export type { UserRepositoryPort } from "./user-repository.port";
export type { OrganizationRepositoryPort } from "./organization-repository.port";
export type { JobMatchingServicePort } from "./job-matching-service.port";
