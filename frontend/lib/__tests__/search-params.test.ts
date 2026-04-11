import {
  buildSearchParams,
  parseSearchParams,
  hasSearchParams,
  buildApiParams,
} from "@/lib/search-params";

describe("buildSearchParams", () => {
  const defaultState = {
    keyword: "",
    location: "",
    jobTypes: [] as ("full-time" | "part-time" | "contract" | "internship")[],
    serviceRoles: [] as ("paid" | "missionary" | "volunteer" | "stipend")[],
    remoteOnly: false,
    sortBy: "recent" as const,
    datePosted: null,
  };

  it("returns empty params for default state", () => {
    const params = buildSearchParams(defaultState);
    expect(params.toString()).toBe("");
  });

  it("sets q param from keyword", () => {
    const params = buildSearchParams({
      ...defaultState,
      keyword: "React developer",
    });
    expect(params.get("q")).toBe("React developer");
  });

  it("trims keyword whitespace", () => {
    const params = buildSearchParams({ ...defaultState, keyword: "  React  " });
    expect(params.get("q")).toBe("React");
  });

  it("sets location param", () => {
    const params = buildSearchParams({
      ...defaultState,
      location: "Boston, MA",
    });
    expect(params.get("location")).toBe("Boston, MA");
  });

  it("appends multiple jobType params", () => {
    const params = buildSearchParams({
      ...defaultState,
      jobTypes: ["full-time", "contract"],
    });
    expect(params.getAll("jobType")).toEqual(["full-time", "contract"]);
  });

  it("sets includeRemote when remoteOnly is true", () => {
    const params = buildSearchParams({ ...defaultState, remoteOnly: true });
    expect(params.get("includeRemote")).toBe("true");
  });

  it("omits includeRemote when remoteOnly is false", () => {
    const params = buildSearchParams(defaultState);
    expect(params.has("includeRemote")).toBe(false);
  });

  it("sets sortBy when not default", () => {
    const params = buildSearchParams({ ...defaultState, sortBy: "relevant" });
    expect(params.get("sortBy")).toBe("relevant");
  });

  it("omits sortBy when default (recent)", () => {
    const params = buildSearchParams(defaultState);
    expect(params.has("sortBy")).toBe(false);
  });

  it("sets datePosted when present", () => {
    const params = buildSearchParams({
      ...defaultState,
      datePosted: "last-7-days",
    });
    expect(params.get("datePosted")).toBe("last-7-days");
  });

  it("omits datePosted when null", () => {
    const params = buildSearchParams(defaultState);
    expect(params.has("datePosted")).toBe(false);
  });

  it("appends multiple compensationType params", () => {
    const params = buildSearchParams({
      ...defaultState,
      serviceRoles: ["paid", "stipend"],
    });
    expect(params.getAll("compensationType")).toEqual(["paid", "stipend"]);
  });

  it("builds full params with all fields set", () => {
    const params = buildSearchParams({
      keyword: "engineer",
      location: "TX",
      jobTypes: ["full-time"],
      serviceRoles: ["paid"],
      remoteOnly: true,
      sortBy: "relevant",
      datePosted: "last-24-hours",
    });
    expect(params.get("q")).toBe("engineer");
    expect(params.get("location")).toBe("TX");
    expect(params.getAll("jobType")).toEqual(["full-time"]);
    expect(params.getAll("compensationType")).toEqual(["paid"]);
    expect(params.get("includeRemote")).toBe("true");
    expect(params.get("sortBy")).toBe("relevant");
    expect(params.get("datePosted")).toBe("last-24-hours");
  });
});

describe("parseSearchParams", () => {
  it("returns empty object for empty params", () => {
    const result = parseSearchParams(new URLSearchParams());
    expect(result).toEqual({});
  });

  it("parses q into keyword", () => {
    const result = parseSearchParams(new URLSearchParams("q=React"));
    expect(result.keyword).toBe("React");
  });

  it("parses location", () => {
    const result = parseSearchParams(
      new URLSearchParams("location=Boston%2C+MA"),
    );
    expect(result.location).toBe("Boston, MA");
  });

  it("parses multiple jobType params", () => {
    const result = parseSearchParams(
      new URLSearchParams("jobType=full-time&jobType=contract"),
    );
    expect(result.jobTypes).toEqual(["full-time", "contract"]);
  });

  it("filters invalid jobType values", () => {
    const result = parseSearchParams(
      new URLSearchParams("jobType=full-time&jobType=invalid"),
    );
    expect(result.jobTypes).toEqual(["full-time"]);
  });

  it("omits jobTypes if all values are invalid", () => {
    const result = parseSearchParams(new URLSearchParams("jobType=bogus"));
    expect(result.jobTypes).toBeUndefined();
  });

  it("parses multiple compensationType params", () => {
    const result = parseSearchParams(
      new URLSearchParams("compensationType=paid&compensationType=volunteer"),
    );
    expect(result.serviceRoles).toEqual(["paid", "volunteer"]);
  });

  it("filters invalid compensationType values", () => {
    const result = parseSearchParams(
      new URLSearchParams("compensationType=paid&compensationType=invalid"),
    );
    expect(result.serviceRoles).toEqual(["paid"]);
  });

  it("omits serviceRoles if all values are invalid", () => {
    const result = parseSearchParams(
      new URLSearchParams("compensationType=bogus"),
    );
    expect(result.serviceRoles).toBeUndefined();
  });

  it("parses includeRemote=true into remoteOnly", () => {
    const result = parseSearchParams(new URLSearchParams("includeRemote=true"));
    expect(result.remoteOnly).toBe(true);
  });

  it("ignores includeRemote with non-true value", () => {
    const result = parseSearchParams(
      new URLSearchParams("includeRemote=false"),
    );
    expect(result.remoteOnly).toBeUndefined();
  });

  it("parses valid sortBy", () => {
    const result = parseSearchParams(new URLSearchParams("sortBy=relevant"));
    expect(result.sortBy).toBe("relevant");
  });

  it("ignores invalid sortBy", () => {
    const result = parseSearchParams(new URLSearchParams("sortBy=popularity"));
    expect(result.sortBy).toBeUndefined();
  });

  it("parses valid datePosted", () => {
    const result = parseSearchParams(
      new URLSearchParams("datePosted=last-7-days"),
    );
    expect(result.datePosted).toBe("last-7-days");
  });

  it("ignores invalid datePosted", () => {
    const result = parseSearchParams(
      new URLSearchParams("datePosted=last-month"),
    );
    expect(result.datePosted).toBeUndefined();
  });

  it("parses full URL with all params", () => {
    const result = parseSearchParams(
      new URLSearchParams(
        "q=engineer&location=TX&jobType=full-time&includeRemote=true&sortBy=relevant&datePosted=last-24-hours",
      ),
    );
    expect(result).toEqual({
      keyword: "engineer",
      location: "TX",
      jobTypes: ["full-time"],
      remoteOnly: true,
      sortBy: "relevant",
      datePosted: "last-24-hours",
    });
  });

  it("ignores unrelated params", () => {
    const result = parseSearchParams(new URLSearchParams("page=2&limit=20"));
    expect(result).toEqual({});
  });
});

describe("hasSearchParams", () => {
  it("returns false for empty params", () => {
    expect(hasSearchParams(new URLSearchParams())).toBe(false);
  });

  it("returns true when q is present", () => {
    expect(hasSearchParams(new URLSearchParams("q=test"))).toBe(true);
  });

  it("returns true when location is present", () => {
    expect(hasSearchParams(new URLSearchParams("location=TX"))).toBe(true);
  });

  it("returns true when jobType is present", () => {
    expect(hasSearchParams(new URLSearchParams("jobType=full-time"))).toBe(
      true,
    );
  });

  it("returns true when compensationType is present", () => {
    expect(hasSearchParams(new URLSearchParams("compensationType=paid"))).toBe(
      true,
    );
  });

  it("returns true when includeRemote is present", () => {
    expect(hasSearchParams(new URLSearchParams("includeRemote=true"))).toBe(
      true,
    );
  });

  it("returns true when sortBy is present", () => {
    expect(hasSearchParams(new URLSearchParams("sortBy=relevant"))).toBe(true);
  });

  it("returns true when datePosted is present", () => {
    expect(hasSearchParams(new URLSearchParams("datePosted=last-7-days"))).toBe(
      true,
    );
  });

  it("returns false for unrelated params", () => {
    expect(hasSearchParams(new URLSearchParams("page=1"))).toBe(false);
  });
});

describe("buildApiParams", () => {
  const defaultState = {
    keyword: "",
    location: "",
    jobTypes: [] as ("full-time" | "part-time" | "contract" | "internship")[],
    serviceRoles: [] as ("paid" | "missionary" | "volunteer" | "stipend")[],
    remoteOnly: false,
    sortBy: "recent" as const,
    datePosted: null,
  };

  it("returns empty object for default state", () => {
    const params = buildApiParams(defaultState);
    expect(params).toEqual({});
  });

  it("maps keyword to q", () => {
    const params = buildApiParams({ ...defaultState, keyword: "React" });
    expect(params.q).toBe("React");
  });

  it("parses location into city and state", () => {
    const params = buildApiParams({ ...defaultState, location: "Boston, MA" });
    expect(params.city).toBe("Boston");
    expect(params.state).toBe("MA");
    expect(params.zipcode).toBeUndefined();
  });

  it("parses location into zipcode", () => {
    const params = buildApiParams({ ...defaultState, location: "02101" });
    expect(params.zipcode).toBe("02101");
    expect(params.city).toBeUndefined();
    expect(params.state).toBeUndefined();
  });

  it("parses full location with city, state, zipcode", () => {
    const params = buildApiParams({
      ...defaultState,
      location: "Boston, MA, 02101",
    });
    expect(params.city).toBe("Boston");
    expect(params.state).toBe("MA");
    expect(params.zipcode).toBe("02101");
  });

  it("maps jobTypes to jobType array", () => {
    const params = buildApiParams({
      ...defaultState,
      jobTypes: ["full-time", "contract"],
    });
    expect(params.jobType).toEqual(["full-time", "contract"]);
  });

  it("maps serviceRoles to compensationType array", () => {
    const params = buildApiParams({
      ...defaultState,
      serviceRoles: ["paid", "volunteer"],
    });
    expect(params.compensationType).toEqual(["paid", "volunteer"]);
  });

  it("omits compensationType when serviceRoles is empty", () => {
    const params = buildApiParams(defaultState);
    expect(params.compensationType).toBeUndefined();
  });

  it("sets includeRemote when remoteOnly is true", () => {
    const params = buildApiParams({ ...defaultState, remoteOnly: true });
    expect(params.includeRemote).toBe(true);
  });

  it("omits includeRemote when remoteOnly is false", () => {
    const params = buildApiParams(defaultState);
    expect(params.includeRemote).toBeUndefined();
  });

  it("maps non-default sortBy", () => {
    const params = buildApiParams({ ...defaultState, sortBy: "relevant" });
    expect(params.sortBy).toBe("relevant");
  });

  it("omits sortBy when default", () => {
    const params = buildApiParams(defaultState);
    expect(params.sortBy).toBeUndefined();
  });

  it("does not include empty location fields", () => {
    const params = buildApiParams({ ...defaultState, location: "   " });
    expect(params.city).toBeUndefined();
    expect(params.state).toBeUndefined();
    expect(params.zipcode).toBeUndefined();
  });

  it("maps datePosted when set", () => {
    const params = buildApiParams({
      ...defaultState,
      datePosted: "last-7-days",
    });
    expect(params.datePosted).toBe("last-7-days");
  });

  it("omits datePosted when null", () => {
    const params = buildApiParams(defaultState);
    expect(params.datePosted).toBeUndefined();
  });
});
