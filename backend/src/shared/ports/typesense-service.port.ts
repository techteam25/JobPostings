import type {
  DeleteResponse,
  ImportResponse,
  SearchResponse,
} from "typesense/lib/Typesense/Documents";

import type { JobWithSkills } from "@/validations/job.validation";
import type { JobDocumentType } from "@/validations/base.validation";

export interface TypesenseJobServicePort {
  /**
   * Indexes a single job document in Typesense.
   */
  indexJobDocument(doc: JobWithSkills): Promise<JobWithSkills>;

  /**
   * Indexes multiple job documents in Typesense.
   */
  indexManyJobDocuments(
    docs: JobWithSkills[],
  ): Promise<ImportResponse<JobWithSkills>[]>;

  /**
   * Retrieves a job document by its ID from Typesense.
   */
  retrieveJobDocumentById(jobId: string): Promise<JobWithSkills>;

  /**
   * Updates a job document by its ID in Typesense.
   */
  updateJobDocumentById(
    jobId: string,
    updatedFields: Partial<JobWithSkills>,
  ): Promise<JobWithSkills>;

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
