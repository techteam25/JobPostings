import { typesenseClient } from "@/config/typesense-client";

import { JOBS_COLLECTION } from "@/services/typesense.service/constants";

export const createPostedJobsSchema = async () => {
  const collections = await typesenseClient.collections().retrieve();
  const exists = collections.some((c) => c.name === JOBS_COLLECTION);

  if (!exists) {
    return await typesenseClient.collections().create({
      name: JOBS_COLLECTION,
      fields: [
        { name: "id", type: "string" },
        { name: "title", type: "string" },
        { name: "company", type: "string" },
        { name: "description", type: "string" },
        { name: "city", type: "string", optional: true, facet: true },
        { name: "state", type: "string", optional: true, facet: true },
        { name: "country", type: "string", optional: true, facet: true },
        { name: "isRemote", type: "bool", facet: true },
        { name: "status", type: "string", facet: true },
        { name: "experience", type: "string", optional: true, facet: true },
        { name: "jobType", type: "string", facet: true },
        { name: "skills", type: "string[]", facet: true },
        { name: "createdAt", type: "int64" },
      ],
      default_sorting_field: "createdAt",
    });
  }
  return;
};
