import { describe, expect, it } from "vitest";

import {
  buildFilterValue,
  buildGeocodeResultFromPlace,
  buildLabel,
  parseAddressComponents,
} from "@/lib/geocode/build-geocode-result";

const austinComponents = [
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
];

const zipOnlyComponents = [
  {
    longText: "78701",
    shortText: "78701",
    types: ["postal_code"],
  },
  {
    longText: "Texas",
    shortText: "TX",
    types: ["administrative_area_level_1", "political"],
  },
];

const texasComponents = [
  {
    longText: "Texas",
    shortText: "TX",
    types: ["administrative_area_level_1", "political"],
  },
];

describe("buildLabel", () => {
  it("combines city and state code", () => {
    expect(buildLabel("Austin", "TX")).toBe("Austin, TX");
  });

  it("returns primary when state code is missing", () => {
    expect(buildLabel("Remote", undefined)).toBe("Remote");
  });
});

describe("buildFilterValue", () => {
  it("builds candidate-search filter for a city", () => {
    expect(buildFilterValue("Austin", "Texas", false)).toBe(
      "Austin, Texas, United States",
    );
  });

  it("returns empty string for zip-only picks", () => {
    expect(buildFilterValue("78701", "Texas", true)).toBe("");
  });

  it("returns primary when state is missing", () => {
    expect(buildFilterValue("Remote", undefined, false)).toBe("Remote");
  });
});

describe("parseAddressComponents", () => {
  it("extracts city, state, stateCode, and zip from Google components", () => {
    expect(parseAddressComponents(austinComponents)).toEqual({
      city: "Austin",
      state: "Texas",
      stateCode: "TX",
      zip: "78701",
    });
  });

  it("extracts zip and state from postal-code results", () => {
    expect(parseAddressComponents(zipOnlyComponents)).toEqual({
      city: undefined,
      state: "Texas",
      stateCode: "TX",
      zip: "78701",
    });
  });

  it("extracts state-only components", () => {
    expect(parseAddressComponents(texasComponents)).toEqual({
      city: undefined,
      state: "Texas",
      stateCode: "TX",
      zip: undefined,
    });
  });
});

describe("buildGeocodeResultFromPlace", () => {
  it("builds a city result with label and filterValue", () => {
    const result = buildGeocodeResultFromPlace(
      "places/ChIJATX",
      { latitude: 30.2672, longitude: -97.7431 },
      austinComponents,
      ["locality", "political"],
    );

    expect(result).toEqual({
      id: "places/ChIJATX",
      label: "Austin, TX",
      filterValue: "Austin, Texas, United States",
      city: "Austin",
      state: "Texas",
      stateCode: "TX",
      zip: "78701",
      lat: 30.2672,
      lng: -97.7431,
    });
  });

  it("builds a zip-only result with empty filterValue", () => {
    const result = buildGeocodeResultFromPlace(
      "places/ChIJZIP",
      { latitude: 30.27, longitude: -97.74 },
      zipOnlyComponents,
      ["postal_code"],
    );

    expect(result.label).toBe("78701, TX");
    expect(result.filterValue).toBe("");
    expect(result.zip).toBe("78701");
  });

  it("builds a state-only result", () => {
    const result = buildGeocodeResultFromPlace(
      "places/ChIJTX",
      { latitude: 31.0, longitude: -99.0 },
      texasComponents,
      ["administrative_area_level_1", "political"],
    );

    expect(result.label).toBe("Texas");
    expect(result.filterValue).toBe("Texas, United States");
    expect(result.state).toBe("Texas");
    expect(result.stateCode).toBe("TX");
  });
});
