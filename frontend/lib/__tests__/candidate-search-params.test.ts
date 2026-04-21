import { describe, expect, it } from "vitest";

import {
  buildCandidateSearchParams,
  hasCandidateSearchParams,
  parseCandidateSearchParams,
  type CandidateSearchUrlState,
} from "@/lib/candidate-search-params";

const baseState: CandidateSearchUrlState = {
  skills: [],
  location: "",
  locationFilter: "",
  locationZipcode: "",
  minYearsExperience: null,
  openToWork: false,
};

describe("candidate-search-params", () => {
  describe("buildCandidateSearchParams", () => {
    it("emits only `location` when locationFilter matches (free-form input)", () => {
      const params = buildCandidateSearchParams({
        ...baseState,
        location: "Austin, TX",
        locationFilter: "Austin, TX",
      });

      expect(params.get("location")).toBe("Austin, TX");
      expect(params.has("locationFilter")).toBe(false);
    });

    it("emits both `location` and `locationFilter` when they diverge (picked suggestion)", () => {
      const params = buildCandidateSearchParams({
        ...baseState,
        location: "Austin, TX",
        locationFilter: "Austin, Texas, United States",
      });

      expect(params.get("location")).toBe("Austin, TX");
      expect(params.get("locationFilter")).toBe("Austin, Texas, United States");
    });

    it("omits both when location is empty", () => {
      const params = buildCandidateSearchParams(baseState);
      expect(params.has("location")).toBe(false);
      expect(params.has("locationFilter")).toBe(false);
    });

    it("emits locationFilter even when location is empty but filter has a value", () => {
      // Edge case guard — users should only reach this state via programmatic
      // weirdness, but the builder shouldn't silently drop a filter.
      const params = buildCandidateSearchParams({
        ...baseState,
        location: "",
        locationFilter: "Austin, Texas, United States",
      });
      // `location` param stays out (empty); `locationFilter` is emitted.
      expect(params.has("location")).toBe(false);
      expect(params.get("locationFilter")).toBe("Austin, Texas, United States");
    });
  });

  describe("parseCandidateSearchParams", () => {
    it("parses both fields when present", () => {
      const params = new URLSearchParams(
        "location=Austin%2C+TX&locationFilter=Austin%2C+Texas%2C+United+States",
      );
      const parsed = parseCandidateSearchParams(params);
      expect(parsed.location).toBe("Austin, TX");
      expect(parsed.locationFilter).toBe("Austin, Texas, United States");
    });

    it("falls back: locationFilter = location when only `location` is in the URL", () => {
      const params = new URLSearchParams("location=Austin%2C+TX");
      const parsed = parseCandidateSearchParams(params);
      expect(parsed.location).toBe("Austin, TX");
      expect(parsed.locationFilter).toBe("Austin, TX");
    });

    it("returns nothing for location when URL has neither", () => {
      const params = new URLSearchParams("skills=React");
      const parsed = parseCandidateSearchParams(params);
      expect(parsed.location).toBeUndefined();
      expect(parsed.locationFilter).toBeUndefined();
    });
  });

  describe("hasCandidateSearchParams", () => {
    it("returns true when the URL carries only locationFilter", () => {
      // A locationFilter by itself shouldn't happen via the builder, but the
      // detector should still recognize it as a candidate-search URL so
      // hydration kicks in.
      const params = new URLSearchParams(
        "locationFilter=Austin%2C+Texas%2C+United+States",
      );
      expect(hasCandidateSearchParams(params)).toBe(true);
    });
  });

  describe("locationZipcode", () => {
    it("emits and parses locationZipcode independently of location", () => {
      const params = buildCandidateSearchParams({
        ...baseState,
        location: "78701, TX",
        locationFilter: "",
        locationZipcode: "78701",
      });
      expect(params.get("location")).toBe("78701, TX");
      expect(params.has("locationFilter")).toBe(false);
      expect(params.get("locationZipcode")).toBe("78701");

      const parsed = parseCandidateSearchParams(params);
      expect(parsed.location).toBe("78701, TX");
      // When `locationZipcode` is present but `locationFilter` is absent,
      // the parser MUST NOT fall back to the display value. The backend
      // ANDs location + zipcode filters, and the indexed candidate
      // `location` field never contains zipcodes — so a filter like
      // `location:"78701, TX"` would tokenize to zero matches and defeat
      // the purpose of picking a zipcode suggestion.
      expect(parsed.locationFilter).toBe("");
      expect(parsed.locationZipcode).toBe("78701");
    });

    it("survives reload: picking a zipcode then re-hydrating preserves empty locationFilter", () => {
      // Simulate the full pick → serialize → URL → parse cycle.
      const built = buildCandidateSearchParams({
        ...baseState,
        location: "78701, TX",
        locationFilter: "",
        locationZipcode: "78701",
      });
      const parsed = parseCandidateSearchParams(built);
      expect(parsed.locationFilter).toBe("");
      expect(parsed.locationZipcode).toBe("78701");
    });

    it("omits locationZipcode when empty", () => {
      const params = buildCandidateSearchParams({
        ...baseState,
        location: "Austin, TX",
        locationFilter: "Austin, Texas, United States",
        locationZipcode: "",
      });
      expect(params.has("locationZipcode")).toBe(false);
    });
  });

  describe("roundtrip", () => {
    it("preserves divergent location / locationFilter through build + parse", () => {
      const built = buildCandidateSearchParams({
        ...baseState,
        location: "Houston, TX",
        locationFilter: "Houston, Texas, United States",
        skills: ["React", "TypeScript"],
        minYearsExperience: 3,
        openToWork: true,
      });
      const parsed = parseCandidateSearchParams(built);
      expect(parsed.location).toBe("Houston, TX");
      expect(parsed.locationFilter).toBe("Houston, Texas, United States");
      expect(parsed.skills).toEqual(["React", "TypeScript"]);
      expect(parsed.minYearsExperience).toBe(3);
      expect(parsed.openToWork).toBe(true);
    });
  });
});
