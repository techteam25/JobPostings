import type { SearchResponse } from "typesense/lib/Typesense/Documents";

import { createPostedJobsSchema } from "@/services/typesense.service/typesense.schema";
import { JOBS_COLLECTION } from "@/services/typesense.service/constants";
import { JobWithSkills } from "@/validations/job.validation";
import { typesenseClient } from "@/config/typesense-client";

import logger from "@/logger";
import { PaginationMeta } from "@/types";

type JobDocument = {
  id: string;
  title: string;
  company: string;
  description: string;
  city?: string;
  state?: string;
  country?: string;
  isRemote: boolean;
  status: string;
  experience?: string;
  jobType: string;
  skills: string[];
  createdAt: number;
};

type SortDirection = "asc" | "desc";
type MetaSearchParams = {
  sortBy?: string;
  sortDirection?: SortDirection;
  page?: number;
  offset?: number;
  limit?: number;
};

export class TypesenseService {
  constructor() {
    // Ensure the jobs collection exists upon service initialization
    createPostedJobsSchema().catch(logger.error);
  }

  async indexJobDocument(doc: JobWithSkills) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .create(doc);
  }

  async indexManyJobDocuments(docs: JobWithSkills[]) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .import(docs);
  }

  async retrieveJobDocumentById(jobId: string) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents(jobId)
      .retrieve();
  }

  async updateJobDocumentById(
    jobId: string,
    updatedFields: Partial<JobWithSkills>,
  ) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents(jobId)
      .update(updatedFields);
  }

  async deleteJobDocumentById(jobId: string) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents(jobId)
      .delete();
  }

  async deleteJobDocumentByTitle(jobTitle: string) {
    return await typesenseClient
      .collections(JOBS_COLLECTION)
      .documents()
      .delete({ filter_by: `title:${jobTitle}` });
  }

  async searchJobsCollection(
    q: string = "*",
    filters?: string,
    { sortBy, sortDirection, page, limit, offset }: MetaSearchParams = {
      sortBy: "title",
      sortDirection: "desc",
      page: 1,
      limit: 10,
      offset: 0,
    },
  ): Promise<SearchResponse<JobDocument>> {
    return await typesenseClient
      .collections<JobDocument>(JOBS_COLLECTION)
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
}
