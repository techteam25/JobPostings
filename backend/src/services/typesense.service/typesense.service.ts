import type { SearchResponse } from "typesense/lib/Typesense/Documents";

import { JOBS_COLLECTION } from "@/services/typesense.service/constants";
import { JobWithSkills } from "@/validations/job.validation";
import { typesenseClient } from "@/config/typesense-client";

import { JobDocumentType } from "@/validations/base.validation";

type SortDirection = "asc" | "desc";
type MetaSearchParams = {
  sortBy?: string;
  sortDirection?: SortDirection;
  page?: number;
  offset?: number;
  limit?: number;
};

export class TypesenseService {
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
        isRemote: doc.isRemote,
        experience: doc.experience,
        jobType: doc.jobType,
        skills: ["skill"],
        createdAt: Number(Date.parse(`${doc.createdAt}`)),
      });
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
}
