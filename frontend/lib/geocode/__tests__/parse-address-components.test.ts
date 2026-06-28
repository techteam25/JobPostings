import { describe, expect, it } from "vitest";

import {
  normalizeLegacyAddressComponents,
  parseAddressComponents,
} from "@/lib/geocode/build-geocode-result";

const legacyAustinFixture = [
  {
    long_name: "Austin",
    short_name: "Austin",
    types: ["locality", "political"],
  },
  {
    long_name: "Texas",
    short_name: "TX",
    types: ["administrative_area_level_1", "political"],
  },
  {
    long_name: "78701",
    short_name: "78701",
    types: ["postal_code"],
  },
  {
    long_name: "United States",
    short_name: "US",
    types: ["country", "political"],
  },
];

describe("normalizeLegacyAddressComponents", () => {
  it("maps Geocoding API components to Places (New) shape", () => {
    expect(normalizeLegacyAddressComponents(legacyAustinFixture)).toEqual([
      {
        longText: "Austin",
        shortText: "Austin",
        types: ["locality", "political"],
      },
      {
        longText: "Texas",
        shortText: "TX",
        types: ["administrative_area_level_1", "political"],
      },
      {
        longText: "78701",
        shortText: "78701",
        types: ["postal_code"],
      },
      {
        longText: "United States",
        shortText: "US",
        types: ["country", "political"],
      },
    ]);
  });
});

describe("parseAddressComponents with legacy fixtures", () => {
  it("parses reverse-geocode address components", () => {
    const normalized = normalizeLegacyAddressComponents(legacyAustinFixture);
    expect(parseAddressComponents(normalized)).toEqual({
      city: "Austin",
      state: "Texas",
      stateCode: "TX",
      zip: "78701",
    });
  });
});
