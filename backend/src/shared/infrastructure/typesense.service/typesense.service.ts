import type {
  DeleteResponse,
  SearchResponse,
} from "typesense/lib/Typesense/Documents";

import { JOBS_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import { JobWithSkills } from "@/validations/job.validation";
import { typesenseClient } from "@shared/config/typesense-client";

import type { JobDocumentType } from "@/validations/base.validation";
import logger from "@shared/logger";
import type { TypesenseJobServicePort } from "@shared/ports/typesense-service.port";

type SortDirection = "asc" | "desc";
type MetaSearchParams = {
  sortBy?: string;
  sortDirection?: SortDirection;
  page?: number;
  offset?: number;
  limit?: number;
};

/**
 * Maps a domain `JobWithSkills` onto the shape stored in the Typesense
 * `postedJobs` collection (see migration 0000 + 0003). This is the single
 * source of truth for how a DB job becomes a Typesense document — every
 * index path (single, bulk, future reindex scripts) must go through here.
 */
/**
 * The shape stored in the Typesense `postedJobs` collection. This differs from
 * `JobWithSkills` (nested `employer`, `Date` `createdAt`) — Typesense stores a
 * flat structure with a numeric timestamp.
 */
export interface TypesenseJobDocument {
  id: string;
  title: string;
  company: string;
  description: string;
  city: string;
  state: string | null;
  country: string;
  zipcode: string;
  isRemote: boolean;
  isActive: boolean;
  experience: string | null;
  jobType: string;
  skills: string[];
  employerId?: string;
  compensationType?: string;
  createdAt: number;
}

function mapJobToTypesenseDoc(doc: JobWithSkills): TypesenseJobDocument {
  return {
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
    skills: doc.skills,
    employerId: doc.employerId?.toString(),
    compensationType: doc.compensationType,
    createdAt: new Date(doc.createdAt).getTime(),
  };
}

/**
 * Service class for interacting with Typesense search engine for job documents.
 */
export class TypesenseJobService implements TypesenseJobServicePort {
  /**
   * Indexes a single job document in Typesense.
   * @param doc The job document to index.
   * @returns The result of the indexing operation.
   */
  async indexJobDocument(doc: JobWithSkills): Promise<JobWithSkills> {
    await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .create(mapJobToTypesenseDoc(doc));

    return typesenseClient
      .collections<JobWithSkills>(JOBS_COLLECTION)
      .documents(doc.id.toString())
      .retrieve();
  }

  /**
   * Indexes multiple job documents in Typesense. Uses `upsert` so the caller
   * can repeatedly sync the same IDs without hitting "already exists" errors
   * from Typesense's default `create` action.
   * @param docs The array of job documents to index.
   * @returns The result of the bulk indexing operation.
   */
  async indexManyJobDocuments(docs: JobWithSkills[]) {
    const payload = docs.map(mapJobToTypesenseDoc);
    return await typesenseClient
      .collections<TypesenseJobDocument>(JOBS_COLLECTION)
      .documents()
      .import(payload, { action: "upsert" });
  }

  /**
   * Retrieves a job document by its ID from Typesense.
   * @param jobId The ID of the job document.
   * @returns The retrieved job document.
   */
  async retrieveJobDocumentById(jobId: string) {
    return await typesenseClient
      .collections<JobWithSkills>(JOBS_COLLECTION)
      .documents(jobId)
      .retrieve();
  }

  /**
   * Replaces a job document in Typesense with the supplied DB row. Uses
   * `upsert` so a missing document is created, and routes the payload
   * through `mapJobToTypesenseDoc` so the stored shape always matches the
   * `postedJobs` schema (flat `company` string, int64 `createdAt`, etc.),
   * never the raw `JobWithSkills` with its nested `employer` relation.
   * @param doc The full JobWithSkills to write. Its `id` becomes the
   *            Typesense document id.
   * @returns The upserted Typesense document.
   */
  async upsertJobDocument(doc: JobWithSkills) {
    const payload = mapJobToTypesenseDoc(doc);
    return await typesenseClient
      .collections<TypesenseJobDocument>(JOBS_COLLECTION)
      .documents()
      .upsert(payload);
  }

  /**
   * Deletes a job document by its ID from Typesense.
   * @param jobId The ID of the job document to delete.
   * @returns The result of the delete operation.
   */
  async deleteJobDocumentById(jobId: string) {
    return await typesenseClient
      .collections<DeleteResponse<JobWithSkills>>(JOBS_COLLECTION)
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
      .collections<JobWithSkills>(JOBS_COLLECTION)
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
      sortBy = "createdAt",
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
        sort_by: sortBy ? `${sortBy}:${sortDirection}` : undefined,
        page,
        limit,
        offset,
        query_by: "title, skills, jobType, description, city, state, country",
        include_fields: "$employers(logoUrl, strategy: merge)",
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
      const timestamp = lastSentAt.getTime();
      filterBy = filterBy
        ? `${filterBy} && createdAt:>=${timestamp}`
        : `createdAt:>=${timestamp}`;
    }

    // Always filter to only active jobs
    filterBy = filterBy ? `${filterBy} && isActive:true` : "isActive:true";

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

  /**
   * Searches jobs for recommendations using skill-weighted relevance.
   * Same query_by and weights as alert search, but accepts
   * recommendation-specific filter/sort params.
   */
  async searchJobsForRecommendations(
    q: string,
    filters: string,
    {
      sortBy = "createdAt",
      sortDirection = "desc",
      page = 1,
      limit = 10,
    }: {
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      page?: number;
      limit?: number;
    } = {},
  ): Promise<SearchResponse<JobDocumentType>> {
    return await typesenseClient
      .collections<JobDocumentType>(JOBS_COLLECTION)
      .documents()
      .search({
        q,
        filter_by: filters || undefined,
        query_by: "title, description, company, skills",
        query_by_weights: "3,2,1,2",
        sort_by: `${sortBy}:${sortDirection}`,
        per_page: limit,
        page,
        num_typos: 1,
        prefix: true,
        include_fields: "$employers(logoUrl, strategy: merge)",
      });
  }
}
