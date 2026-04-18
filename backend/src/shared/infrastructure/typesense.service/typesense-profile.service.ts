import { typesenseClient } from "@shared/config/typesense-client";
import { PROFILES_COLLECTION } from "@shared/infrastructure/typesense.service/constants";
import { isTypesenseHttpError } from "@shared/infrastructure/typesense.service/errors";
import type {
  ProfileDocument,
  SearchProfilesParams,
  SearchProfilesResult,
  TypesenseProfileServicePort,
} from "@shared/ports/typesense-profile-service.port";

export class TypesenseProfileService implements TypesenseProfileServicePort {
  async upsertProfile(doc: ProfileDocument): Promise<void> {
    await typesenseClient
      .collections(PROFILES_COLLECTION)
      .documents()
      .upsert(doc);
  }

  async deleteProfile(userId: string): Promise<void> {
    try {
      await typesenseClient
        .collections(PROFILES_COLLECTION)
        .documents(userId)
        .delete();
    } catch (error: unknown) {
      // Deleting a non-existent doc is a no-op from our perspective —
      // indexer jobs run idempotently (e.g. for users who were never
      // eligible for indexing in the first place).
      if (isTypesenseHttpError(error) && error.httpStatus === 404) return;
      throw error;
    }
  }

  async indexManyProfileDocuments(docs: ProfileDocument[]): Promise<void> {
    if (docs.length === 0) return;
    await typesenseClient
      .collections(PROFILES_COLLECTION)
      .documents()
      .import(docs, { action: "upsert" });
  }

  async searchProfilesCollection(
    params: SearchProfilesParams,
  ): Promise<SearchProfilesResult> {
    const response = await typesenseClient
      .collections<ProfileDocument>(PROFILES_COLLECTION)
      .documents()
      .search({
        q: params.q,
        query_by: params.queryBy,
        filter_by: params.filterBy,
        sort_by: params.sortBy,
        page: params.page,
        per_page: params.perPage,
        prefix: params.prefix,
        num_typos: params.numTypos,
      });

    const hits: ProfileDocument[] = (response.hits ?? [])
      .map((hit) => hit.document)
      .filter((doc): doc is ProfileDocument => Boolean(doc));

    return {
      hits,
      found: response.found ?? 0,
      page: response.page ?? params.page ?? 1,
    };
  }
}
