import type { SearchResponse } from "typesense/lib/Typesense/Documents";

import type { JobWithSkills } from "@/validations/job.validation";
import type { JobDocumentType } from "@/validations/base.validation";
import type { TypesenseService } from "@shared/infrastructure/typesense.service/typesense.service";

export interface TypesenseServicePort {
  /**
   * Indexes a single job document in Typesense.
   */
  indexJobDocument(
    doc: JobWithSkills,
  ): Promise<
    Awaited<
      ReturnType<InstanceType<typeof TypesenseService>["indexJobDocument"]>
    >
  >;

  /**
   * Indexes multiple job documents in Typesense.
   */
  indexManyJobDocuments(
    docs: JobWithSkills[],
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof TypesenseService>["indexManyJobDocuments"]
      >
    >
  >;

  /**
   * Retrieves a job document by its ID from Typesense.
   */
  retrieveJobDocumentById(
    jobId: string,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof TypesenseService>["retrieveJobDocumentById"]
      >
    >
  >;

  /**
   * Updates a job document by its ID in Typesense.
   */
  updateJobDocumentById(
    jobId: string,
    updatedFields: Partial<JobWithSkills>,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof TypesenseService>["updateJobDocumentById"]
      >
    >
  >;

  /**
   * Deletes a job document by its ID from Typesense.
   */
  deleteJobDocumentById(
    jobId: string,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof TypesenseService>["deleteJobDocumentById"]
      >
    >
  >;

  /**
   * Deletes job documents by title from Typesense.
   */
  deleteJobDocumentByTitle(
    jobTitle: string,
  ): Promise<
    Awaited<
      ReturnType<
        InstanceType<typeof TypesenseService>["deleteJobDocumentByTitle"]
      >
    >
  >;

  /**
   * Searches the jobs collection in Typesense.
   */
  searchJobsCollection(
    q?: string,
    filters?: string,
    options?: {
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      page?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<SearchResponse<JobDocumentType>>;

  /**
   * Searches jobs for a job alert using alert criteria.
   */
  searchJobsForAlert(
    searchQuery: string | null,
    filters: string,
    lastSentAt: Date | null,
    limit?: number,
  ): Promise<SearchResponse<JobDocumentType>>;
}
