import type {
  DeleteResponse,
  ImportResponse,
  SearchResponse,
} from "typesense/lib/Typesense/Documents";

import type { JobWithSkills } from "@/validations/job.validation";
import type { JobDocumentType } from "@/validations/base.validation";
import type { TypesenseJobDocument } from "@shared/infrastructure/typesense.service/typesense.service";

export interface TypesenseJobServicePort {
  /**
   * Indexes a single job document in Typesense.
   */
  indexJobDocument(doc: JobWithSkills): Promise<JobWithSkills>;

  /**
   * Indexes multiple job documents in Typesense.
   */
  indexManyJobDocuments(docs: JobWithSkills[]): Promise<ImportResponse[]>;

  /**
   * Retrieves a job document by its ID from Typesense.
   */
  retrieveJobDocumentById(jobId: string): Promise<JobWithSkills>;

  /**
   * Replaces a job document in Typesense with the supplied DB row.
   * Uses upsert semantics: a missing document is created. The document's
   * own `id` field determines which Typesense document is written.
   */
  upsertJobDocument(doc: JobWithSkills): Promise<TypesenseJobDocument>;

  /**
   * Deletes a job document by its ID from Typesense.
   */
  deleteJobDocumentById(jobId: string): Promise<DeleteResponse<JobWithSkills>>;

  /**
   * Deletes job documents by title from Typesense.
   */
  deleteJobDocumentByTitle(
    jobTitle: string,
  ): Promise<DeleteResponse<JobWithSkills>>;

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
