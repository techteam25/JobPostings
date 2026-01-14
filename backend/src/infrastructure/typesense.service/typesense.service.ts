import type { SearchResponse } from "typesense/lib/Typesense/Documents";

import { JOBS_COLLECTION } from "@/infrastructure/typesense.service/constants";
import { JobWithSkills } from "@/validations/job.validation";
import { typesenseClient } from "@/config/typesense-client";

import { JobDocumentType } from "@/validations/base.validation";
import logger from "@/logger";

type SortDirection = "asc" | "desc";
type MetaSearchParams = {
  sortBy?: string;
  sortDirection?: SortDirection;
  page?: number;
  offset?: number;
  limit?: number;
};

/**
 * Service class for interacting with Typesense search engine for job documents.
 */
export class TypesenseService {
  /**
   * Indexes a single job document in Typesense.
   * @param doc The job document to index.
   * @returns The result of the indexing operation.
   */
  async indexJobDocument(doc: JobWithSkills) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .create({
        id: doc.id.toString(),
        title: doc.title,
        company: doc.employer.name,
        description: doc.description,
        city: doc.city,
        state: doc.state,
        country: doc.country,
        zipcode: doc.zipcode ? doc.zipcode.toString() : "",
        isRemote: doc.isRemote,
        isActive: doc.isActive,
        experience: doc.experience,
        jobType: doc.jobType,
        skills: ["skill"],
        createdAt: Number(Date.parse(`${doc.createdAt}`)),
      });
  }

  /**
   * Indexes multiple job documents in Typesense.
   * @param docs The array of job documents to index.
   * @returns The result of the bulk indexing operation.
   */
  async indexManyJobDocuments(docs: JobWithSkills[]) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .import(docs);
  }

  /**
   * Retrieves a job document by its ID from Typesense.
   * @param jobId The ID of the job document.
   * @returns The retrieved job document.
   */
  async retrieveJobDocumentById(jobId: string) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents(jobId)
      .retrieve();
  }

  /**
   * Updates a job document by its ID in Typesense.
   * @param jobId The ID of the job document to update.
   * @param updatedFields The fields to update.
   * @returns The result of the update operation.
   */
  async updateJobDocumentById(
    jobId: string,
    updatedFields: Partial<JobWithSkills>,
  ) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents(jobId)
      .update(updatedFields);
  }

  /**
   * Deletes a job document by its ID from Typesense.
   * @param jobId The ID of the job document to delete.
   * @returns The result of the delete operation.
   */
  async deleteJobDocumentById(jobId: string) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents(jobId)
      .delete();
  }

  /**
   * Deletes job documents by title from Typesense.
   * @param jobTitle The title of the job documents to delete.
   * @returns The result of the delete operation.
   */
  async deleteJobDocumentByTitle(jobTitle: string) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .delete({ filter_by: `title:${jobTitle}` });
  }

  /**
   * Searches the jobs collection in Typesense.
   * @param q The search query string.
   * @param filters Optional filter string.
   * @param options Search parameters including sort, pagination, etc.
   * @returns The search response containing matching job documents.
   */
  async searchJobsCollection(
    q: string = "*",
    filters?: string,
    {
      sortBy = "title",
      sortDirection = "desc",
      page = 1,
      limit = 10,
      offset = 0,
    }: MetaSearchParams = {},
  ): Promise<SearchResponse<JobDocumentType>> {
    return await typesenseClient
      .collections<JobDocumentType>(JOBS_COLLECTION)
      .documents()
      .search({
        q,
        filter_by: filters ? filters : undefined,
        sort_by: `${sortBy}:${sortDirection}`,
        page,
        limit,
        offset,
        query_by: "title, skills, jobType, description, city, state, country",
      });
  }

  /**
   * Searches jobs for a job alert using alert criteria.
   * @param searchQuery The search query from the alert.
   * @param filters Filter string built from alert criteria.
   * @param lastSentAt Timestamp to filter jobs created after this time.
   * @param limit Maximum number of results to return.
   * @returns The search response containing matching job documents.
   */
  async searchJobsForAlert(
    searchQuery: string | null,
    filters: string,
    lastSentAt: Date | null,
    limit: number = 50,
  ): Promise<SearchResponse<JobDocumentType>> {
    const q = searchQuery || "*";
    
    // Add timestamp filter to only get jobs created after lastSentAt
    let filterBy = filters;
    if (lastSentAt) {
      const timestamp = Math.floor(lastSentAt.getTime() / 1000);
      filterBy = filterBy 
        ? `${filterBy} && createdAt:>=${timestamp}`
        : `createdAt:>=${timestamp}`;
    }

    // Always filter to only active jobs
    filterBy = filterBy
      ? `${filterBy} && isActive:true`
      : "isActive:true";

    logger.info("Searching jobs for alert", { q, filterBy, limit });

    return await typesenseClient
      .collections<JobDocumentType>(JOBS_COLLECTION)
      .documents()
      .search({
        q,
        filter_by: filterBy,
        query_by: "title, description, company, skills",
        query_by_weights: "3,2,1,2",
        sort_by: "createdAt:desc",
        per_page: limit,
        page: 1,
        num_typos: 1,
        prefix: true,
      });
  }
}
