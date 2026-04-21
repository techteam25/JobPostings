import { BaseService } from "@shared/base/base.service";
import { fail, ok } from "@shared/result";
import { AppError } from "@shared/errors";
import { TypesenseQueryBuilder } from "@shared/infrastructure/typesense.service/typesense-queryBuilder";
import { buildPaginationMeta } from "@shared/infrastructure/typesense.service/build-search-pagination";
import logger from "@shared/logger";

import type {
  ProfileDocument,
  TypesenseProfileServicePort,
} from "@shared/ports/typesense-profile-service.port";
import type {
  CandidateSearchResult,
  CandidateSearchServicePort,
} from "@/modules/organizations/ports/candidate-search-service.port";
import type {
  CandidatePreview,
  SearchCandidatesSchema,
} from "@/validations/candidate-search.validation";

export class CandidateSearchService
  extends BaseService
  implements CandidateSearchServicePort
{
  constructor(private typesenseProfileService: TypesenseProfileServicePort) {
    super();
  }

  async searchCandidates(filters: SearchCandidatesSchema["query"]) {
    try {
      const {
        skills,
        location,
        zipcode,
        minYearsExperience,
        openToWork,
        page,
        limit,
        sortBy,
        sortOrder,
      } = filters;

      const queryBuilder = new TypesenseQueryBuilder()
        .addSingleFilter("isProfilePublic", true)
        .addSingleFilter("intent", "seeker")
        .addSingleFilter("location", location)
        // `zipCode` is indexed as a separate optional string field
        // (migration `0006_add-zipcode-to-profiles`) so we can AND it into
        // the filter independently of the tokenized `location` string.
        .addSingleFilter("zipCode", zipcode)
        .addSingleFilter("openToWork", openToWork);

      if (minYearsExperience !== undefined) {
        queryBuilder.addRangeFilter(
          "yearsOfExperience",
          ">=",
          minYearsExperience,
        );
      }

      const filterBy = queryBuilder.build();

      // Relevance scoring: when skills are provided, `q = skills.join(" ")`
      // with `query_by=skills`, prefix=false, num_typos=0 — Typesense scores
      // hits by skill-token overlap count and the implicit text-match score
      // wins when sortBy=relevant (do NOT pass sort_by in that case).
      //
      // When skills are empty, default to a match-all search (`q="*"`) so
      // recruiters can browse every public seeker profile and filter down.
      // Relevance has no meaning without skill tokens, so fall back to
      // most-recently-updated order for stable pagination.
      const hasSkills = skills.length > 0;
      const q = hasSkills ? skills.join(" ") : "*";
      const effectiveSortBy =
        !hasSkills && sortBy === "relevant" ? "recent" : sortBy;
      const typesenseSortBy = this.resolveSortBy(effectiveSortBy, sortOrder);

      const results =
        await this.typesenseProfileService.searchProfilesCollection({
          q,
          queryBy: "skills",
          filterBy,
          sortBy: typesenseSortBy,
          page,
          perPage: limit,
          prefix: false,
          numTypos: 0,
        });

      const items: CandidatePreview[] = results.hits.map((doc) =>
        this.toCandidatePreview(doc),
      );
      const pagination = buildPaginationMeta(
        { found: results.found, page: results.page },
        limit,
      );

      const result: CandidateSearchResult = { items, pagination };
      return ok(result);
    } catch (error) {
      logger.error(error, "Failed to search candidates");
      return fail(new AppError("Failed to search candidates"));
    }
  }

  /**
   * Maps the validated sortBy/sortOrder to a Typesense `sort_by` string.
   * Returns undefined for `relevant` so text-match scoring wins.
   */
  private resolveSortBy(
    sortBy: SearchCandidatesSchema["query"]["sortBy"],
    sortOrder: SearchCandidatesSchema["query"]["sortOrder"],
  ): string | undefined {
    if (sortBy === "relevant") return undefined;
    if (sortBy === "recent") return "updatedAt:desc";

    const defaultOrder = sortBy === "name" ? "asc" : "desc";
    const order = sortOrder ?? defaultOrder;
    return `${sortBy}:${order}`;
  }

  /**
   * Allowlist projection — strips filter-only fields (`isProfilePublic`,
   * `intent`, `updatedAt`, `id`) and any other attributes that must not
   * leak to employer clients. Never spread.
   */
  private toCandidatePreview(doc: ProfileDocument): CandidatePreview {
    return {
      userId: doc.userId,
      name: doc.name,
      photoUrl: doc.photoUrl ?? null,
      headline: doc.headline,
      skills: doc.skills,
      location: doc.location,
      yearsOfExperience: doc.yearsOfExperience,
      openToWork: doc.openToWork,
    };
  }
}
